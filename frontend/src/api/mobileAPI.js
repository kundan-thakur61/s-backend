import axiosClient from './axiosClient';

const mobileAPI = {
  // Public
  getCompanies: (params) => axiosClient.get('/mobile/companies', { params }),
  getModels: (params) => axiosClient.get('/mobile/models', { params }),

  // Admin (protected)
  adminListCompanies: (params) => axiosClient.get('/admin/mobile/companies', { params }),
  adminCreateCompany: (payload) => axiosClient.post('/admin/mobile/companies', payload),
  adminUpdateCompany: (id, payload) => axiosClient.put(`/admin/mobile/companies/${id}`, payload),
  adminDeleteCompany: (id) => axiosClient.delete(`/admin/mobile/companies/${id}`),

  adminListModels: (params) => axiosClient.get('/admin/mobile/models', { params }),
  adminCreateModel: (payload) => axiosClient.post('/admin/mobile/models', payload),
  adminUpdateModel: (id, payload) => axiosClient.put(`/admin/mobile/models/${id}`, payload),
  adminDeleteModel: (id) => axiosClient.delete(`/admin/mobile/models/${id}`),
  adminUploadModelFrames: (modelId, files, config = {}) => {
    if (!modelId) {
      throw new Error('modelId is required');
    }
    const entries = Array.isArray(files) ? files : Array.from(files || []);
    if (!entries.length) {
      throw new Error('At least one frame image is required');
    }
    const formData = new FormData();
    entries.forEach((file) => formData.append('frames', file));

    return axiosClient.post(`/admin/mobile/models/${modelId}/frames`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: config.onUploadProgress,
    });
  },
  adminDeleteModelFrame: (modelId, frameId) => axiosClient.delete(`/admin/mobile/models/${modelId}/frames/${frameId}`),
};

export default mobileAPI;
