import axiosClient from './axiosClient';

const collectionAPI = {
  listPublic: (params = {}) => axiosClient.get('/collections', { params }),
  getByHandle: (handle) => axiosClient.get(`/collections/${handle}`),
  adminList: (params = {}) => axiosClient.get('/admin/collections', { params }),
  adminCreate: (payload) => axiosClient.post('/admin/collections', payload),
  adminUpdate: (id, payload) => axiosClient.put(`/admin/collections/${id}`, payload),
  adminDelete: (id) => axiosClient.delete(`/admin/collections/${id}`),
  adminAddImages: (id, formData) => axiosClient.post(`/admin/collections/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  adminRemoveImage: (id, imageId) => axiosClient.delete(`/admin/collections/${id}/images/${imageId}`),
};

export default collectionAPI;
