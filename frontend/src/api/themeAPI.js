import axiosClient from './axiosClient';

const themeAPI = {
  getActive: () => axiosClient.get('/mobile/themes/active'),
  getByKey: (key) => axiosClient.get(`/mobile/themes/${key}`),
};

export default themeAPI;
