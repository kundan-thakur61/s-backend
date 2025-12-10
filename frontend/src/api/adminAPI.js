import axiosClient from './axiosClient';

const adminAPI = {
  getDashboardOverview: () => axiosClient.get('/admin/overview'),

  getThemes: (params) => axiosClient.get('/admin/themes', { params }),

  getThemeCategories: () => axiosClient.get('/admin/themes/categories'),

  createThemeCategory: (payload) => axiosClient.post('/admin/themes/categories', payload),

  updateThemeCategory: (id, payload) => axiosClient.put(`/admin/themes/categories/${id}`, payload),

  deleteThemeCategory: (id) => axiosClient.delete(`/admin/themes/categories/${id}`),

  createTheme: (payload) => axiosClient.post('/admin/themes', payload),

  updateTheme: (id, payload) => axiosClient.put(`/admin/themes/${id}`, payload),

  deleteTheme: (id) => axiosClient.delete(`/admin/themes/${id}`),

  activateTheme: (id) => axiosClient.put(`/admin/themes/${id}/activate`),
};

export default adminAPI;

