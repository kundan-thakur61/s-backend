import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import orderAPI from '../api/orderAPI';

const SUPPORT_CHAT_URL = import.meta.env.VITE_SUPPORT_CHAT_URL || '';
const SUPPORT_PHONE = (import.meta.env.VITE_SUPPORT_PHONE || '').replace(/[^0-9+]/g, '');
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@mobilecovers.com';

export const useOrderActions = (orderId, onOrderUpdate) => {
  const [cancelling, setCancelling] = useState(false);
  const [printing, setPrinting] = useState(false);

  const cancelOrder = useCallback(async (order, reason = '') => {
    const status = (order.status || order.payment?.status || '').toString().toLowerCase();
    console.debug('[CancelOrder] Current order:', order);
    console.debug('[CancelOrder] Current status:', status);
    if (reason) console.debug('[CancelOrder] Provided reason:', reason);
    const cancellable = !(status === 'cancelled' || status === 'delivered' || status === 'shipped');

    if (!cancellable) {
      toast.info('Order cannot be cancelled at this stage');
      console.warn('[CancelOrder] Attempted to cancel non-cancellable order:', order);
      return false;
    }

    try {
      setCancelling(true);
      const cancelResp = await orderAPI.cancelOrder(order._id || order.id, reason);
      console.debug('[CancelOrder] API response:', cancelResp);
      toast.success('Order cancelled successfully');

      // Refetch updated order data
      const resp = await orderAPI.getOrder(orderId);
      console.debug('[CancelOrder] Refetched order data:', resp);
      const data = resp.data?.data || resp.data || resp;
      const orderData = data.order || data;
      onOrderUpdate?.(orderData);

      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel order';
      toast.error(errorMessage);
      console.error('[CancelOrder] Error:', err, 'Order:', order);
      return false;
    } finally {
      setCancelling(false);
      console.debug('[CancelOrder] Cancel flow finished.');
    }
  }, [orderId, onOrderUpdate]);

  const printReceipt = useCallback(async () => {
    try {
      setPrinting(true);
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Focus on the window before printing for better browser compatibility
      window.focus();
      window.print();
      
      toast.success('Receipt sent to printer');
    } catch (err) {
      toast.error('Failed to print receipt');
    } finally {
      setPrinting(false);
    }
  }, []);

  const chatWithSupport = useCallback((orderId) => {
    const orderLabel = orderId ? `Order ID: ${orderId}` : 'my recent order';
    const rawMessage = `Hi team, I need help with ${orderLabel}.`;
    const encodedMessage = encodeURIComponent(rawMessage);

    let targetUrl = '';
    if (SUPPORT_CHAT_URL) {
      targetUrl = SUPPORT_CHAT_URL.replace('{orderId}', orderId || '');
    } else if (SUPPORT_PHONE) {
      const phone = SUPPORT_PHONE.startsWith('+') ? SUPPORT_PHONE.substring(1) : SUPPORT_PHONE;
      targetUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    } else {
      targetUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Order Support Request')}&body=${encodedMessage}`;
    }

    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      toast.info('Opening chat support...');
    } catch (err) {
      console.error('[ChatSupport] Failed to open support channel', err);
      toast.error('Unable to open chat support. Please contact us via email.');
    }
  }, []);

  return {
    cancelOrder,
    printReceipt,
    chatWithSupport,
    cancelling,
    printing
  };
};
