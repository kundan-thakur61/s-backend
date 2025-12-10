import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import orderAPI from '../api/orderAPI';
import authAPI from '../api/authAPI';
import { selectCartItems, selectCartTotal, clearCart, loadCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import { formatPrice, SCREEN_RECT } from '../utils/helpers';

const UPI_APPS = [
  { id: 'phonepe', label: 'PhonePe', accent: '#5f259f', hint: 'Instant collect request' },
  { id: 'gpay', label: 'Google Pay', accent: '#1a73e8', hint: 'Works with QR + collect' },
  { id: 'paytm', label: 'Paytm', accent: '#02b9f4', hint: 'Wallet + bank UPI' },
];

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [upiId, setUpiId] = useState('');
  const [saveUpi, setSaveUpi] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState('');

  const [shipping, setShipping] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const [errors, setErrors] = useState({});
  const currentUpiApp = UPI_APPS.find((app) => app.id === selectedUpiApp);

  useEffect(() => {
    if (user) {
      setShipping((s) => ({ ...s, name: user.name || s.name, phone: user.phone || s.phone }));
    }
    // load saved UPI id if present
    try {
      const saved = localStorage.getItem('savedUpi');
      if (saved) {
        setUpiId(saved);
        setSaveUpi(true);
      }
      const savedApp = localStorage.getItem('savedUpiApp');
      if (savedApp) {
        setSelectedUpiApp(savedApp);
      }
    } catch (e) {
      console.debug('Could not read savedUpi from localStorage', e);
    }
  }, [user]);

  // Ensure cart is loaded from localStorage when opening checkout directly
  useEffect(() => {
    try {
      dispatch(loadCart());
    } catch (e) {
      console.debug('Failed to load cart from storage', e);
    }
  }, [dispatch]);

  const validate = () => {
    const e = {};
    if (!shipping.name.trim()) e.name = 'Name is required';
    if (!/^[0-9]{7,15}$/.test(shipping.phone)) e.phone = 'Phone must be 7-15 digits';
    if (!shipping.address1.trim()) e.address1 = 'Address is required';
    if (!shipping.city.trim()) e.city = 'City is required';
    if (!shipping.state.trim() || shipping.state.trim().length < 2) e.state = 'State is required';
    if (!shipping.postalCode.trim()) e.postalCode = 'Postal code is required';
    if (!shipping.country.trim()) e.country = 'Country is required';
    if (paymentMethod === 'upi') {
      // basic VPA check like 'name@bank'
      if (!upiId || !/^\S+@\S+$/.test(upiId)) e.upiId = 'Enter a valid UPI ID (example: user@bank)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!cartItems || cartItems.length === 0) {
      return toast.error('Your cart is empty');
    }

    // Require user to be authenticated before placing an order
    if (!user) {
      toast.error('Please log in to place an order');
      navigate('/login');
      return;
    }

    if (!validate()) return toast.error('Please fix shipping errors');

    setLoading(true);
    try {
      const normalizedItems = (cartItems || [])
        .map((item) => {
          const rawProductId = item.product && (item.product._id || item.product.id);
          if (!rawProductId) return null;
          const productId = String(rawProductId);
          const rawVariantId = item.variant && (item.variant._id || item.variant.id);
          const fallbackVariantId = productId.startsWith('custom_') ? `${productId}_variant` : null;
          const variantId = rawVariantId ? String(rawVariantId) : fallbackVariantId;
          if (!variantId) return null;
          const quantity = Math.max(1, Number(item.quantity) || 1);
          const price = Number(item.variant?.price ?? item.price ?? 0);

          const baseItem = {
            productId,
            variantId,
            quantity,
            price,
          };

          if (productId.startsWith('custom_')) {
            baseItem.product = { ...item.product, _id: productId };
            baseItem.variant = {
              ...item.variant,
              _id: variantId,
              id: variantId,
              price,
            };
            baseItem.title = item.product?.title || 'Custom product';
          }

          return baseItem;
        })
        .filter(Boolean);

      if (!normalizedItems.length) {
        throw new Error('Cart items look invalid. Please rebuild your cart and try again.');
      }

      const orderPayload = {
        items: normalizedItems,
        total,
        paymentMethod,
        shippingAddress: {
          name: shipping.name,
          phone: shipping.phone,
          address1: shipping.address1,
          address2: shipping.address2,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: shipping.country || 'India',
        },
      };

      // 1) Create order on server
      // include optional payment details when using UPI
      if (paymentMethod === 'upi') {
        const upiAppLabel = UPI_APPS.find((app) => app.id === selectedUpiApp)?.label;
        orderPayload.paymentDetails = {
          upiId,
          ...(selectedUpiApp ? { upiApp: selectedUpiApp, upiAppLabel } : {}),
        };
      }
      // persist saved UPI to server if requested and user is authenticated
      if (saveUpi && user) {
        try {
          await authAPI.updateProfile({ upiId });
          localStorage.setItem('savedUpi', upiId);
          if (selectedUpiApp) {
            localStorage.setItem('savedUpiApp', selectedUpiApp);
          }
        } catch (e) {
          // non-fatal
        }
      } else if (!saveUpi) {
        try {
          localStorage.removeItem('savedUpi');
          localStorage.removeItem('savedUpiApp');
        } catch (e) { console.debug('Could not remove savedUpi', e); }
      }

      const createResp = await orderAPI.createOrder(orderPayload);
      const created = createResp.data?.data || createResp.data || createResp;
      const order = created.order || created;

      if (paymentMethod === 'razorpay' || paymentMethod === 'upi') {
        // 2) Create Razorpay order on server
        const payResp = await orderAPI.createPaymentOrder(order._id);
        const payData = payResp.data?.data || payResp.data || payResp;

        // Expect server to return at least orderId and keyId/amount
        const razorpayOrderId = payData.razorpayOrderId || payData.orderId || payData.id;
        const keyId = payData.keyId || payData.key || payData.key_id || import.meta.env.VITE_RAZORPAY_KEY;
        const amount = payData.amount || order.total || Math.round(total * 100);
        const currency = payData.currency || 'INR';

        await loadRazorpayScript();

        const options = {
          key: keyId,
          amount: amount,
          currency,
          order_id: razorpayOrderId,
          name: 'CopadMob',
          description: `Order #${order._id}`,
          handler: async function (response) {
            try {
              await orderAPI.verifyPayment({
                orderId: order._id || order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              dispatch(clearCart());
              toast.success('Payment successful');
              navigate(`/order-success/${order._id}`);
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: shipping.name,
            contact: shipping.phone,
            // prefill vpa for UPI flows if provided
            ...(paymentMethod === 'upi' && upiId ? { vpa: upiId } : {})
          },
          notes: {
            platform: 'copadmob',
            ...(paymentMethod === 'upi' && selectedUpiApp ? { upiApp: selectedUpiApp } : {}),
          },
          theme: { color: '#2563eb' },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          toast.error(resp.error?.description || 'Payment failed');
        });
        rzp.open();
      } else {
        // COD or other non-online
        dispatch(clearCart());
        toast.success('Order placed successfully');
        navigate(`/order-success/${order._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Checkout</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shipping Form */}
        <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-lg font-medium mb-3">Shipping Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Full name</label>
              <input
                value={shipping.name}
                onChange={(e) => setShipping((s) => ({ ...s, name: e.target.value }))}
                className={`mt-1 block w-full border rounded px-3 py-2 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm">Phone</label>
              <input
                value={shipping.phone}
                onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                className={`mt-1 block w-full border rounded px-3 py-2 ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm">Address</label>
              <input
                value={shipping.address1}
                onChange={(e) => setShipping((s) => ({ ...s, address1: e.target.value }))}
                className={`mt-1 block w-full border rounded px-3 py-2 ${errors.address1 ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="Street address, P.O. box, company name, c/o"
              />
              {errors.address1 && <p className="text-xs text-red-600 mt-1">{errors.address1}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm">Address line 2 (optional)</label>
              <input
                value={shipping.address2}
                onChange={(e) => setShipping((s) => ({ ...s, address2: e.target.value }))}
                className="mt-1 block w-full border rounded px-3 py-2 border-gray-300"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            <div>
              <label className="block text-sm">City</label>
              <input
                value={shipping.city}
                onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                className={`mt-1 block w-full border rounded px-3 py-2 ${errors.city ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm">State / Region</label>
              <input
                value={shipping.state}
                onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                className="mt-1 block w-full border rounded px-3 py-2 border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm">Postal code</label>
              <input
                value={shipping.postalCode}
                onChange={(e) => setShipping((s) => ({ ...s, postalCode: e.target.value }))}
                className={`mt-1 block w-full border rounded px-3 py-2 ${errors.postalCode ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.postalCode && <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>}
            </div>

            <div>
              <label className="block text-sm">Country</label>
              <input
                value={shipping.country}
                onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                className={`mt-1 block w-full border rounded px-3 py-2 ${errors.country ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <aside className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-lg font-medium mb-3">Order Summary</h3>
          <div className="space-y-3">
            <div className="max-h-48 overflow-auto">
              {cartItems && cartItems.length > 0 ? (
                cartItems.map((item, idx) => (
                  <div
                    key={`${item?.product?._id || item?.product?.id || 'p' + idx}-${item?.variant?._id || item?.variant?.id || 'v' + idx}`}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-12 h-24 bg-gray-100 rounded overflow-hidden relative">
                        {item.product?.design ? (
                          (() => {
                            const thumbOuterW = 48; // inner width slightly smaller to keep aspect
                            const fullW = 260;
                            const scale = thumbOuterW / fullW;
                            const d = item.product.design;
                            const t = d.transform || { x: 0, y: 0, scale: 1 };
                            const sx = SCREEN_RECT.left * scale;
                            const sy = SCREEN_RECT.top * scale;
                            const sw = SCREEN_RECT.width * scale;
                            const sh = SCREEN_RECT.height * scale;
                            const imgStyle = {
                              position: 'absolute',
                              left: `${sx + (sw / 2)}px`,
                              top: `${sy + (sh / 2)}px`,
                              transform: `translate(-50%,-50%) translate(${t.x * scale}px, ${t.y * scale}px) scale(${t.scale})`,
                              transformOrigin: 'center center',
                              width: `${fullW * scale}px`,
                            };
                            return (
                              <>
                                <div style={{ position: 'absolute', left: sx, top: sy, width: sw, height: sh, overflow: 'hidden', background: '#fff' }}>
                                  {d.imgSrc ? <img src={d.imgSrc} alt="design" style={imgStyle} /> : null}
                                </div>
                                {d.frame && <img src={d.frame} alt="frame" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />}
                              </>
                            );
                          })()
                        ) : (
                          <img src={item.product.images?.[0] || ''} className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div>
                              <div className="font-medium">{item?.product?.title || 'Unnamed product'}</div>
                              <div className="text-sm text-gray-600">{(item?.variant?.name || item?.variant?.color || '') + ' × ' + (item?.quantity || 0)}</div>
                              {String(item?.product?._id || '').startsWith('custom_') && (
                                <div className="mt-1">
                                  <button onClick={() => {
                                    try {
                                      sessionStorage.setItem('currentDesign', JSON.stringify(item.product.design || {}));
                                      sessionStorage.setItem('editingCustomId', item.product._id);
                                    } catch(e) { console.debug('failed to set editing keys', e); }
                                    const meta = item.product.design?.meta || {};
                                    const pid = encodeURIComponent(`${meta.company || ''}__${meta.model || ''}__${meta.type || ''}`);
                                    const hasMeta = !!(meta.company || meta.model || meta.type);
                                    if (hasMeta) window.location.href = `/customizer/${pid}`;
                                    else window.location.href = '/customizer';
                                  }} className="text-xs mt-1 inline-block text-indigo-600">Edit design</button>
                                </div>
                              )}
                      </div>
                    </div>
                    <div className="font-medium">{formatPrice((item?.variant?.price || 0) * (item?.quantity || 0))}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600 p-3">No items in your cart.</div>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="pm" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                  <span>Pay with Razorpay</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="pm" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                  <span>Pay with UPI</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="pm"  checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <span>Cash on Delivery</span>
                </label>
              </div>
              {paymentMethod === 'upi' && (
                <div className="mt-2 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Choose UPI app</p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {UPI_APPS.map((app) => {
                        const active = selectedUpiApp === app.id;
                        return (
                          <button
                            type="button"
                            key={app.id}
                            onClick={() => setSelectedUpiApp(app.id)}
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${active ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' : 'border-gray-200 hover:border-primary-200'}`}
                            aria-pressed={active}
                          >
                            <span
                              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                              style={{ backgroundColor: app.accent }}
                            >
                              {app.label.slice(0, 2)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold">{app.label}</p>
                              <p className="text-xs text-gray-500">{app.hint}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="block text-sm">UPI ID (VPA)</label>
                  <input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className={`mt-1 block w-full border rounded px-3 py-2 ${errors.upiId ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="example@bank"
                  />
                  {errors.upiId && <p className="text-xs text-red-600 mt-1">{errors.upiId}</p>}
                  <div className="flex items-center mt-2">
                    <input id="saveUpi" type="checkbox" checked={saveUpi} onChange={(e) => setSaveUpi(e.target.checked)} />
                    <label htmlFor="saveUpi" className="ml-2 text-sm">Save this UPI for future payments</label>
                  </div>

                  {/* QR preview */}
                  {upiId && (
                    <div className="mt-3 flex items-start space-x-4">
                      <div>
                        <img
                          src={(() => {
                            try {
                              const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shipping.name || user?.name || '')}&am=${encodeURIComponent((total || 0).toString())}&cu=INR&tn=${encodeURIComponent('CopadMob order')}`;
                              return `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(upiLink)}`;
                            } catch (e) { return ''; }
                          })()}
                          alt="UPI QR"
                          className="w-32 h-32 border rounded"
                        />
                      </div>
                      <div>
                        <div className="text-sm">
                          {currentUpiApp ? `Approve the request inside ${currentUpiApp.label}` : 'Or scan the QR / use this VPA:'}
                        </div>
                        <div className="font-mono mt-1">{upiId}</div>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard?.writeText(upiId); toast.success('UPI ID copied'); }}
                          className="mt-2 inline-block bg-gray-200 text-sm px-3 py-1 rounded"
                        >
                          Copy VPA
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3">
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:opacity-50"
              >
                {loading
                  ? 'Processing…'
                  : paymentMethod === 'razorpay'
                    ? 'Pay & Place Order'
                    : paymentMethod === 'upi'
                      ? `Pay via ${currentUpiApp?.label || 'UPI'}`
                      : 'Place Order (COD)'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}