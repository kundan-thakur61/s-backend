import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminAPI from '../../api/adminAPI';

export const fetchDashboardOverview = createAsyncThunk(
  'adminDashboard/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getDashboardOverview();
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard overview');
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  overview: null,
  salesTrend: [],
  topProducts: [],
  recentOrders: [],
  recentCustomOrders: [],
  lastUpdated: null,
};

const adminDashboardSlice = createSlice({
  name: 'adminDashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload.overview;
        state.salesTrend = action.payload.salesTrend || [];
        state.topProducts = action.payload.topProducts || [];
        state.recentOrders = action.payload.recentOrders || [];
        state.recentCustomOrders = action.payload.recentCustomOrders || [];
        state.lastUpdated = action.payload.generatedAt || new Date().toISOString();
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardError } = adminDashboardSlice.actions;
export default adminDashboardSlice.reducer;

