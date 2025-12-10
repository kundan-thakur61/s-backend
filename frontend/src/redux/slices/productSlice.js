import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productAPI from '../../api/productAPI';

const createEmptyBreakdown = () => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

const createInitialReviewsState = () => ({
  items: [],
  rating: { average: 0, count: 0 },
  breakdown: createEmptyBreakdown(),
  pagination: { page: 1, limit: 10, totalPages: 1, totalItems: 0 },
  viewerReview: null
});

const normalizeBreakdown = (incoming) => {
  const normalized = createEmptyBreakdown();
  if (!incoming) return normalized;
  Object.keys(normalized).forEach((key) => {
    const numericKey = Number(key);
    normalized[key] = incoming[key] ?? incoming[numericKey] ?? 0;
  });
  return normalized;
};

const upsertReview = (reviewsState, review) => {
  if (!review) return;
  const index = reviewsState.items.findIndex((item) => item._id === review._id);
  if (index >= 0) {
    reviewsState.items[index] = review;
    return;
  }
  reviewsState.items.unshift(review);
  const limit = reviewsState.pagination?.limit;
  if (limit && reviewsState.items.length > limit) {
    reviewsState.items = reviewsState.items.slice(0, limit);
  }
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProducts(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProduct(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await productAPI.createProduct(productData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await productAPI.updateProduct(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await productAPI.deleteProduct(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

export const fetchTrendingProducts = createAsyncThunk(
  'products/fetchTrendingProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProducts({ ...params, trending: true });
      return response.data.data.products;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trending products');
    }
  }
);

export const fetchProductReviews = createAsyncThunk(
  'products/fetchProductReviews',
  async ({ productId, page = 1, limit = 10 }, { rejectWithValue }) => {
    if (!productId) {
      return rejectWithValue('Product ID is required');
    }
    try {
      const response = await productAPI.getProductReviews(productId, { page, limit });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load reviews');
    }
  }
);

export const createProductReview = createAsyncThunk(
  'products/createProductReview',
  async ({ productId, payload }, { rejectWithValue }) => {
    if (!productId) {
      return rejectWithValue('Product ID is required');
    }
    try {
      const response = await productAPI.createProductReview(productId, payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit review');
    }
  }
);

export const updateProductReview = createAsyncThunk(
  'products/updateProductReview',
  async ({ productId, reviewId, payload }, { rejectWithValue }) => {
    if (!productId || !reviewId) {
      return rejectWithValue('Review identifier is required');
    }
    try {
      const response = await productAPI.updateProductReview(productId, reviewId, payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update review');
    }
  }
);

export const deleteProductReview = createAsyncThunk(
  'products/deleteProductReview',
  async ({ productId, reviewId }, { rejectWithValue }) => {
    if (!productId || !reviewId) {
      return rejectWithValue('Review identifier is required');
    }
    try {
      const response = await productAPI.deleteProductReview(productId, reviewId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete review');
    }
  }
);

// Initial state
const initialState = {
  products: [],
  trendingProducts: [],
  currentProduct: null,
  loading: false,
  error: null,
  reviews: createInitialReviewsState(),
  reviewsLoading: false,
  reviewsError: null,
  reviewMutation: { loading: false, error: null },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    brand: '',
    model: '',
    type: '',
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    inStock: true,
  },
  sortBy: '-createdAt',
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Single Product
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload.product;
        state.error = null;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload.product);
        state.error = null;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(p => p._id === action.payload.product._id);
        if (index !== -1) {
          state.products[index] = action.payload.product;
        }
        if (state.currentProduct?._id === action.payload.product._id) {
          state.currentProduct = action.payload.product;
        }
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(p => p._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Trending Products
      .addCase(fetchTrendingProducts.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchTrendingProducts.fulfilled, (state, action) => {
        state.trendingProducts = action.payload;
        state.error = null;
      })
      .addCase(fetchTrendingProducts.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch Product Reviews
      .addCase(fetchProductReviews.pending, (state) => {
        state.reviewsLoading = true;
        state.reviewsError = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.reviewsError = null;
        const base = createInitialReviewsState();
        const payload = action.payload || {};
        state.reviews = {
          items: payload.items || base.items,
          rating: payload.rating || base.rating,
          breakdown: normalizeBreakdown(payload.breakdown),
          pagination: payload.pagination || base.pagination,
          viewerReview: payload.viewerReview || base.viewerReview
        };
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        state.reviewsError = action.payload || 'Failed to load reviews';
      })
      // Create Product Review
      .addCase(createProductReview.pending, (state) => {
        state.reviewMutation.loading = true;
        state.reviewMutation.error = null;
      })
      .addCase(createProductReview.fulfilled, (state, action) => {
        state.reviewMutation.loading = false;
        state.reviewMutation.error = null;
        const payload = action.payload || {};
        if (payload.review) {
          upsertReview(state.reviews, payload.review);
          state.reviews.viewerReview = payload.review;
        }
        if (payload.rating) {
          state.reviews.rating = payload.rating;
        }
        if (payload.breakdown) {
          state.reviews.breakdown = normalizeBreakdown(payload.breakdown);
        }
      })
      .addCase(createProductReview.rejected, (state, action) => {
        state.reviewMutation.loading = false;
        state.reviewMutation.error = action.payload || 'Failed to submit review';
      })
      // Update Product Review
      .addCase(updateProductReview.pending, (state) => {
        state.reviewMutation.loading = true;
        state.reviewMutation.error = null;
      })
      .addCase(updateProductReview.fulfilled, (state, action) => {
        state.reviewMutation.loading = false;
        state.reviewMutation.error = null;
        const payload = action.payload || {};
        if (payload.review) {
          upsertReview(state.reviews, payload.review);
          state.reviews.viewerReview = payload.review;
        }
        if (payload.rating) {
          state.reviews.rating = payload.rating;
        }
        if (payload.breakdown) {
          state.reviews.breakdown = normalizeBreakdown(payload.breakdown);
        }
      })
      .addCase(updateProductReview.rejected, (state, action) => {
        state.reviewMutation.loading = false;
        state.reviewMutation.error = action.payload || 'Failed to update review';
      })
      // Delete Product Review
      .addCase(deleteProductReview.pending, (state) => {
        state.reviewMutation.loading = true;
        state.reviewMutation.error = null;
      })
      .addCase(deleteProductReview.fulfilled, (state, action) => {
        state.reviewMutation.loading = false;
        state.reviewMutation.error = null;
        const payload = action.payload || {};
        if (payload.reviewId) {
          state.reviews.items = state.reviews.items.filter(review => review._id !== payload.reviewId);
        }
        state.reviews.viewerReview = null;
        if (payload.rating) {
          state.reviews.rating = payload.rating;
        }
        if (payload.breakdown) {
          state.reviews.breakdown = normalizeBreakdown(payload.breakdown);
        }
      })
      .addCase(deleteProductReview.rejected, (state, action) => {
        state.reviewMutation.loading = false;
        state.reviewMutation.error = action.payload || 'Failed to delete review';
      });
  },
});

export const { setFilters, clearFilters, setSortBy, setPage, clearError } = productSlice.actions;

// Selectors
export const selectProducts = (state) => state.products.products;
export const selectTrendingProducts = (state) => state.products.trendingProducts;
export const selectCurrentProduct = (state) => state.products.currentProduct;
export const selectProductLoading = (state) => state.products.loading;
export const selectProductError = (state) => state.products.error;
export const selectPagination = (state) => state.products.pagination;
export const selectFilters = (state) => state.products.filters;
export const selectSortBy = (state) => state.products.sortBy;
export const selectProductReviewsData = (state) => state.products.reviews;
export const selectProductReviewsLoading = (state) => state.products.reviewsLoading;
export const selectProductReviewsError = (state) => state.products.reviewsError;
export const selectProductReviewMutationState = (state) => state.products.reviewMutation;

export default productSlice.reducer;
