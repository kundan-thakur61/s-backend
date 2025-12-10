import axiosClient from './axiosClient';

const wishlistAPI = {
  getWishlist: () => axiosClient.get('/wishlist'),
  addToWishlist: (productId) => axiosClient.post('/wishlist', { productId }),
  removeFromWishlist: (productId) => axiosClient.delete(`/wishlist/${productId}`),
};

export default wishlistAPI;
