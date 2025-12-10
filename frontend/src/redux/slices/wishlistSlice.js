import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import wishlistAPI from '../../api/wishlistAPI';

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.getWishlist();
      return response.data.data.wishlist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistAPI.addToWishlist(productId);
      return response.data.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      return productId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlistError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWishlist.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchWishlist.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(addToWishlist.pending, (state) => { state.error = null; })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        // prevent duplicates
        if (!state.items.find(p => p._id === action.payload._id)) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => { state.error = action.payload; })

      .addCase(removeFromWishlist.pending, (state) => { state.error = null; })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p._id !== action.payload);
      })
      .addCase(removeFromWishlist.rejected, (state, action) => { state.error = action.payload; });
  }
});

export const { clearWishlistError } = wishlistSlice.actions;

export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistCount = (state) => state.wishlist.items.length;
export const selectWishlistLoading = (state) => state.wishlist.loading;

export default wishlistSlice.reducer;
