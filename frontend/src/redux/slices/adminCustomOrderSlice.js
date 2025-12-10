import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import customAPI from '../../api/customAPI';

// Async thunks for admin custom order management
export const fetchAllCustomOrders = createAsyncThunk(
  'adminCustomOrders/fetchAllCustomOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await customAPI.getAllCustomOrders(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch custom orders');
    }
  }
);

export const updateCustomOrderStatus = createAsyncThunk(
  'adminCustomOrders/updateCustomOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await customAPI.updateCustomOrderStatus(id, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update custom order status');
    }
  }
);

export const deleteCustomOrder = createAsyncThunk(
  'adminCustomOrders/deleteCustomOrder',
  async (id, { rejectWithValue }) => {
    try {
      await customAPI.deleteCustomOrder(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete custom order');
    }
  }
);

// Initial state
const initialState = {
  customOrders: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    hasNextPage: false,
    total: 0,
  },
  filters: {
    status: '',
    userId: '',
  },
};

const adminCustomOrderSlice = createSlice({
  name: 'adminCustomOrders',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Custom Orders
      .addCase(fetchAllCustomOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCustomOrders.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { customOrders, pagination: { currentPage, totalPages, totalOrders, hasNext, hasPrev } }
        state.customOrders = action.payload.customOrders || [];
        const backendPagination = action.payload.pagination || {};
        state.pagination = {
          page: backendPagination.currentPage || state.pagination.page,
          limit: state.pagination.limit,
          hasNextPage: typeof backendPagination.hasNext === 'boolean' ? backendPagination.hasNext : state.pagination.hasNextPage,
          total: backendPagination.totalOrders || state.pagination.total,
        };
        state.error = null;
      })
      .addCase(fetchAllCustomOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Custom Order Status
      .addCase(updateCustomOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customOrders.findIndex(co => co._id === action.payload.customOrder._id);
        if (index !== -1) {
          state.customOrders[index] = action.payload.customOrder;
        }
        state.error = null;
      })
      .addCase(updateCustomOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Custom Order
      .addCase(deleteCustomOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.customOrders = state.customOrders.filter(co => co._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteCustomOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setPage, clearError } = adminCustomOrderSlice.actions;

export default adminCustomOrderSlice.reducer;
