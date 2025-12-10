import axiosClient from './axiosClient';

const BASE = '/custom-designs';

const createDesign = async (payload) => {
  return axiosClient.post(BASE, payload).then(res => res.data);
}

const updateDesign = async (id, payload) => {
  return axiosClient.put(`${BASE}/${id}`, payload).then(res => res.data);
}

const getMyDesigns = async () => {
  return axiosClient.get(BASE).then(res => res.data);
}

const getDesign = async (id) => {
  return axiosClient.get(`${BASE}/${id}`).then(res => res.data);
}

const deleteDesign = async (id) => {
  return axiosClient.delete(`${BASE}/${id}`).then(res => res.data);
}

export default { createDesign, updateDesign, getMyDesigns, getDesign, deleteDesign };
