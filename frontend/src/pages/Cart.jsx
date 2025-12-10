import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { removeFromCart, updateQuantity, loadCart } from '../redux/slices/cartSlice';
import ProductCard from '../components/ProductCard';

import { useNavigate } from 'react-router-dom'
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowLeft } from 'react-icons/fi';
import { formatPrice, getProductImage, SCREEN_RECT } from '../utils/helpers';
import { toast } from 'react-toastify';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const { products, loading } = useSelector((state) => state.products);

  useEffect(() => {
    // Load cart from localStorage on component mount
    dispatch(loadCart());
  }, [dispatch]);

  const handleQuantityChange = (productId, variantId, newQuantity) => {
    if (newQuantity < 1) {
      dispatch(removeFromCart({ productId, variantId }));
      toast.info('Item removed from cart');
    } else {
      dispatch(updateQuantity({ productId, variantId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (productId, variantId) => {
    dispatch(removeFromCart({ productId, variantId }));
    toast.info('Item removed from cart');
  };

  const subtotal = items.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over ₹500
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const finalTotal = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FiShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link
              to="/products"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.product._id}-${item.variant._id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
                    {item.product?.design ? (
                      // Render composed thumbnail: scaled down screen area + frame overlay
                      (() => {
                        const thumbOuterW = 80; // same as container
                        const fullW = 260; // canvas width used elsewhere
                        const scale = thumbOuterW / fullW; // scale transforms
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
                            {/* frame */}
                            {d.frame && <img src={d.frame} alt="frame" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />}
                          </>
                        );
                      })()
                    ) : (
                      <img
                        src={getProductImage(item.product)}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product._id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-primary-600 line-clamp-1"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-gray-600">
                      {(item.product.brand || item.product?.design?.meta?.company || '').toString()} {item.product.model || item.product?.design?.meta?.model ? `• ${item.product.model || item.product?.design?.meta?.model}` : ''}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: (item.variant.color ? String(item.variant.color).toLowerCase() : '#e5e7eb') }}
                      />
                      <span className="text-sm text-gray-600">{item.variant.color}</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item.product._id, item.variant._id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-50 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-2 text-center min-w-[3rem] font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.product._id, item.variant._id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-50 disabled:opacity-50"
                        disabled={item.quantity >= item.variant.stock}
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(item.variant.price * item.quantity)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(item.variant.price)} each
                    </p>
                  </div>

                  {/* Edit / Remove Buttons */}
                  <div className="flex flex-col items-center gap-2">
                    {String(item.product._id || '').startsWith('custom_') && (
                      <button
                        onClick={() => {
                          try {
                            // put current design into session for editing
                            sessionStorage.setItem('currentDesign', JSON.stringify(item.product.design || {}));
                            sessionStorage.setItem('editingCustomId', item.product._id);
                          } catch (e) { /* ignore */ }
                          // navigate to canvas based on design meta
                          const meta = item.product.design?.meta || {};
                          const hasMeta = !!(meta.company || meta.model || meta.type);
                          const pid = encodeURIComponent(`${meta.company || ''}__${meta.model || ''}__${meta.type || ''}`);
                          if (hasMeta) {
                            navigate(`/customizer/${pid}`);
                          } else {
                            navigate('/customizer');
                          }
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Edit design"
                      >
                        Edit
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveItem(item.product._id, item.variant._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove item"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({items.length} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (GST 18%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Notice */}
              {subtotal < 500 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Add {formatPrice(500 - subtotal)} more for free shipping!
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <Link
                to="/checkout"
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 mt-6 inline-block text-center"
              >
                Proceed to Pay
              </Link>

              <Link
                to="/products"
                className="mt-3 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Products or Recommendations */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">You Might Also Like</h2>
          <div className="text-center text-gray-600">
            <p>Product recommendations will be displayed here</p>


            {loading ? (
            <CardSkeleton count={4} />
          ) : Array.isArray(products) && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No products found.</p>
          )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
