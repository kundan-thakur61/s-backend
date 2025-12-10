import axiosClient from './axiosClient';

const orderAPI = {
  // Create new order
  createOrder: (orderData) => {
    return axiosClient.post('/orders', orderData);
  },

  // Create Razorpay payment order
  createPaymentOrder: (orderId) => {
    return axiosClient.post('/orders/pay/create', { orderId });
  },

  // Verify payment
  verifyPayment: (paymentData) => {
    return axiosClient.post('/orders/pay/verify', paymentData);
  },

  // Get user's orders
  getMyOrders: (params) => {
    return axiosClient.get('/orders/my', { params });
  },

  // Get user's custom orders
  getMyCustomOrders: () => {
    return axiosClient.get('/orders/my-custom');
  },

  // Get single order
  getOrder: (id) => {
    return axiosClient.get(`/orders/${id}`);
  },

  // Cancel order
  cancelOrder: (id, reason) => {
    return axiosClient.put(`/orders/${id}/cancel`, { reason });
  },

  // Admin endpoints
  getAllOrders: (params) => {
    return axiosClient.get('/admin/orders', { params });
  },

  updateOrderStatus: (id, statusData) => {
    return axiosClient.put(`/admin/orders/${id}/status`, statusData);
  },
};

export default orderAPI;