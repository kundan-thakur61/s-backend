import axiosClient from './axiosClient';

const customAPI = {
  // Create custom order
  createOrder: (orderData) => {
    return axiosClient.post('/custom/order', orderData);
  },

  // Create payment for custom order
  createPayment: (customOrderId) => {
    return axiosClient.post('/custom/pay', { customOrderId });
  },

  // Verify custom payment
  verifyPayment: (paymentData) => {
    return axiosClient.post('/custom/pay/verify', paymentData);
  },

  // Get user's custom orders
  getMyOrders: (params) => {
    return axiosClient.get('/custom/orders', { params });
  },

  // Get single custom order
  getOrder: (id) => {
    return axiosClient.get(`/custom/orders/${id}`);
  },

  // Admin endpoints
  getAllCustomOrders: (params) => {
    return axiosClient.get('/admin/custom-orders', { params });
  },

  approveCustomOrder: (id, approvalData) => {
    return axiosClient.put(`/admin/custom/${id}/approve`, approvalData);
  },

  rejectCustomOrder: (id, rejectionData) => {
    return axiosClient.put(`/admin/custom/${id}/reject`, rejectionData);
  },

  updateCustomOrderStatus: (id, statusData) => {
    const payload = typeof statusData === 'string' ? { status: statusData } : statusData;
    return axiosClient.put(`/admin/custom/${id}/status`, payload);
  },

  deleteCustomOrder: (id) => {
    return axiosClient.delete(`/admin/custom/${id}`);
  },
};

export default customAPI;