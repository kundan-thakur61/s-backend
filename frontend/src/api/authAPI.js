import axiosClient from './axiosClient';

const authAPI = {
  // Authentication endpoints
  login: (credentials) => {
    return axiosClient.post('/auth/login', credentials);
  },

  register: (userData) => {
    return axiosClient.post('/auth/register', userData);
  },

  getMe: () => {
    // Normalize response to return the nested data object { user }
    return axiosClient.get('/auth/me').then((res) => res.data?.data || res.data);
  },

  updateProfile: (userData) => {
    return axiosClient.put('/auth/profile', userData);
  },

  addAddress: (addressData) => {
    return axiosClient.post('/auth/address', addressData);
  },

  deleteAddress: (addressId) => {
    return axiosClient.delete(`/auth/address/${addressId}`);
  },

  // Utility function to check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Utility function to get user role
  getUserRole: async () => {
    try {
      const response = await authAPI.getMe();
      return response.user;
    } catch (error) {
      return null;
    }
  },
};

export default authAPI;