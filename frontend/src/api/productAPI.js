import axiosClient from './axiosClient';

const productAPI = {
  // Get all products with filters, sorting, and pagination
  getProducts: (params) => {
    return axiosClient.get('/products', { params });
  },

  // Get single product by ID
  getProduct: (id) => {
    return axiosClient.get(`/products/${id}`);
  },

  // Create new product (Admin only)
  createProduct: (productData) => {
    return axiosClient.post('/products', productData);
  },

  // Update product (Admin only)
  updateProduct: (id, productData) => {
    return axiosClient.put(`/products/${id}`, productData);
  },

  // Delete product (Admin only)
  deleteProduct: (id) => {
    return axiosClient.delete(`/products/${id}`);
  },

  // Add variant to product (Admin only)
  addVariant: (productId, variantData) => {
    return axiosClient.post(`/products/${productId}/variants`, variantData);
  },

  // Update variant (Admin only)
  updateVariant: (productId, variantId, variantData) => {
    return axiosClient.put(`/products/${productId}/variants/${variantId}`, variantData);
  },

  // Delete variant (Admin only)
  deleteVariant: (productId, variantId) => {
    return axiosClient.delete(`/products/${productId}/variants/${variantId}`);
  },

  // Product reviews
  getProductReviews: (productId, params) => {
    return axiosClient.get(`/products/${productId}/reviews`, { params });
  },
  createProductReview: (productId, payload) => {
    return axiosClient.post(`/products/${productId}/reviews`, payload);
  },
  updateProductReview: (productId, reviewId, payload) => {
    return axiosClient.put(`/products/${productId}/reviews/${reviewId}`, payload);
  },
  deleteProductReview: (productId, reviewId) => {
    return axiosClient.delete(`/products/${productId}/reviews/${reviewId}`);
  },
};

export default productAPI;