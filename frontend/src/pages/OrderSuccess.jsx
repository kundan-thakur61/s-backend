import { useEffect, useState, useCallback, useMemo } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import CancellationReasonModal from '../components/CancellationReasonModal';
import io from 'socket.io-client';
import { useParams, Link } from 'react-router-dom';
import orderAPI from '../api/orderAPI';
import Loader, { PageLoader } from '../components/Loader';
import OrderTracking from '../components/OrderTracking';
import SuccessAnimation from '../components/SuccessAnimation';
import { formatPrice } from '../utils/helpers';
import { toast } from 'react-toastify';
import { useOrderActions } from '../hooks/useOrderActions';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Custom hook for order actions
  const { cancelOrder, printReceipt, chatWithSupport, cancelling, printing } = useOrderActions(id, setOrder);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [reasonComment, setReasonComment] = useState('');
  const [reasonError, setReasonError] = useState('');

  // Memoized order status for performance
  const orderStatus = useMemo(() => {
    if (!order) return null;
    return {
      status: order.status || order.payment?.status || 'pending',
      isCancellable: !['cancelled', 'delivered', 'shipped'].includes(
        (order.status || order.payment?.status || '').toString().toLowerCase()
      ),
      isActive: !['cancelled', 'delivered'].includes(
        (order.status || order.payment?.status || '').toString().toLowerCase()
      )
    };
  }, [order]);

  // Enhanced fetch order with retry mechanism
  const fetchOrder = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const resp = await orderAPI.getOrder(id);
      const data = resp.data?.data || resp.data || resp;
      const orderData = data.order || data;
      
      if (!orderData) {
        throw new Error('Order data not found');
      }
      
      setOrder(orderData);
      setShowAnimation(true);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load order';
      setError(errorMessage);
      console.error('Order fetch error:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [id]);

  // Retry mechanism
  const retryFetch = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      fetchOrder();
    } else {
      toast.error('Maximum retry attempts reached. Please refresh the page.');
    }
  }, [retryCount, fetchOrder]);

  useEffect(() => {
    let mounted = true;
    if (id && mounted) {
      fetchOrder();
      // Use Vite env variable for backend URL
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const sock = io(backendUrl);
      sock.emit('joinOrderRoom', id);
      sock.on('orderStatusUpdate', (data) => {
        if (data.orderId === id) {
          setOrder((prev) => ({ ...prev, status: data.status, trackingNumber: data.trackingNumber, notes: data.notes }));
        }
      });
      return () => {
        sock.emit('leaveOrderRoom', id);
        sock.disconnect();
      };
    } else if (!id) {
      setLoading(false);
      setError('No order ID provided');
    }
    return () => { mounted = false; };
  }, [id, fetchOrder]);

  // Handle order actions
  // Step 1: Show confirmation modal before actual cancel
  const handleCancelOrder = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  // Step 2: If confirmed, actually cancel
  const confirmCancelOrder = useCallback(() => {
    if (!order) return;
    setShowCancelModal(false);
    setShowReasonModal(true);
  }, [order]);

  const closeReasonModal = useCallback(() => {
    if (cancelling) return;
    setShowReasonModal(false);
    setSelectedReason('');
    setReasonComment('');
    setReasonError('');
  }, [cancelling]);

  const handleReasonChange = useCallback((value) => {
    setSelectedReason(value);
    if (reasonError) setReasonError('');
  }, [reasonError]);

  const handleCommentChange = useCallback((value) => {
    setReasonComment(value);
    if (reasonError) setReasonError('');
  }, [reasonError]);

  const submitCancellationReason = useCallback(async () => {
    if (!order) return;
    if (!selectedReason) {
      setReasonError('Please select a reason for cancellation.');
      return;
    }
    if (!reasonComment.trim() || reasonComment.trim().length < 5) {
      setReasonError('Comments must be at least 5 characters long.');
      return;
    }
    setReasonError('');
    const compiledReason = `${selectedReason}: ${reasonComment.trim()}`;
    const success = await cancelOrder(order, compiledReason);
    if (success) {
      closeReasonModal();
    }
  }, [order, selectedReason, reasonComment, cancelOrder, closeReasonModal]);

  const handleChatSupport = useCallback(() => {
    chatWithSupport(order?._id || order?.id);
  }, [order, chatWithSupport]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <PageLoader />
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Order</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={retryFetch}
                disabled={retryCount >= 3}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label={`Retry loading order (attempt ${retryCount + 1} of 3)`}
              >
                {retryCount >= 3 ? 'Max Retries Reached' : `Retry (${retryCount}/3)`}
              </button>
              <Link 
                to="/" 
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 text-center"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order not found state
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20.4a7.962 7.962 0 01-8-7.691c0-4.411 3.589-8 8-8s8 3.589 8 8a7.962 7.962 0 01-2 5.291z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
            <Link 
              to="/orders" 
              className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Success Header with Animation */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="text-center">
            <SuccessAnimation 
              show={showAnimation} 
              onComplete={() => console.log('Animation complete')} 
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Thank you — your order is confirmed!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Order ID: <span className="font-mono font-semibold text-gray-900">{order._id || order.id}</span>
            </p>
            
            {/* Status Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {orderStatus?.status || 'Confirmed'}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Shipping Information */}
            <section aria-labelledby="shipping-heading">
              <h2 id="shipping-heading" className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Shipping Address
              </h2>
              <div className="text-sm text-gray-700 space-y-1">
                <div className="font-medium">{order.shippingAddress?.name || 'N/A'}</div>
                <div>{order.shippingAddress?.address1} {order.shippingAddress?.address2}</div>
                <div>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</div>
                <div>{order.shippingAddress?.country}</div>
                {order.shippingAddress?.phone && (
                  <div className="mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {order.shippingAddress.phone}
                  </div>
                )}
              </div>
            </section>

            {/* Payment & Status Information */}
            <section aria-labelledby="payment-heading">
              <h2 id="payment-heading" className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payment & Status
              </h2>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-medium">{order.paymentMethod || order.payment?.method || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${orderStatus?.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                    {orderStatus?.status || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatPrice(order.total || order.amount || 0)}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Order Items */}
          <section aria-labelledby="items-heading" className="border-t pt-6">
            <h2 id="items-heading" className="font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {(order.items || order.orderItems || []).map((item, index) => (
                <div 
                  key={`${item.productId || item.product?._id || item.product}-${item.variantId || item.variant?._id || index}`} 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 last:border-b-0 space-y-2 sm:space-y-0"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.product?.title || item.name || item.productName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.variant?.name || item.variant?.color || item.variantName || ''} × {item.quantity}
                    </p>
                  </div>
                  <div className="font-semibold text-gray-900 sm:text-right">
                    {formatPrice((item.price || item.unitPrice || 0) * (item.quantity || 1))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-6 border-t mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link 
                to="/orders" 
                className="text-primary-600 hover:text-primary-800 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded transition-colors duration-200"
              >
                View All Orders
              </Link>
              <button
                type="button"
                onClick={printReceipt}
                disabled={printing}
                className="flex items-center text-sm bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Print receipt"
              >
                {printing ? (
                  <>
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Printing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Receipt
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {orderStatus?.isCancellable && (
                <>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="flex items-center justify-center bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    aria-label="Cancel order"
                  >
                    {cancelling ? (
                      <>
                        <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Order'
                    )}
                  </button>
                  <ConfirmationModal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={confirmCancelOrder}
                    title={
                      <span className="flex items-center gap-2">
                        <span role="img" aria-label="deal" className="text-xl">💸</span>
                        You saved ₹{order?.discount || 0} on this product!
                      </span>
                    }
                    message={
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          {(order?.productImage || order?.items?.[0]?.image) && (
                            <img
                              src={order?.productImage || order?.items?.[0]?.image}
                              alt="Product"
                              className="w-16 h-16 rounded object-cover border"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{order?.items?.[0]?.title || 'Your order'}</p>
                            {order?.items?.[0]?.brand && (
                              <p className="text-sm text-gray-500">{order?.items?.[0]?.brand}</p>
                            )}
                          </div>
                        </div>
                        <p>
                          If you cancel now, you may not be able to avail this deal again. Do you still want to cancel?
                        </p>
                      </div>
                    }
                    confirmText="Cancel Order"
                    cancelText="Don't cancel"
                    loading={cancelling}
                    variant="info"
                  />
                </>
              )}
              <Link 
                to="/" 
                className="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200 text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Order Tracking Component */}
        <OrderTracking 
          order={order} 
          onCancel={handleCancelOrder}
          onChat={handleChatSupport}
        />
      </div>

      {/* Cancellation Reason Modal */}
      <CancellationReasonModal
        isOpen={showReasonModal}
        onClose={closeReasonModal}
        onSubmit={submitCancellationReason}
        selectedReason={selectedReason}
        onReasonChange={handleReasonChange}
        comment={reasonComment}
        onCommentChange={handleCommentChange}
        loading={cancelling}
        error={reasonError}
      />
    </div>
  );
}
