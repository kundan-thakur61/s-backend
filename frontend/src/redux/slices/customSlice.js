import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import customAPI from '../../api/customAPI';

// Async thunks
export const createCustomOrder = createAsyncThunk(
  'custom/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await customAPI.createOrder(orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create custom order');
    }
  }
);

export const createCustomPayment = createAsyncThunk(
  'custom/createPayment',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await customAPI.createPayment(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment');
    }
  }
);

export const verifyCustomPayment = createAsyncThunk(
  'custom/verifyPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await customAPI.verifyPayment(paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment verification failed');
    }
  }
);

export const fetchCustomOrders = createAsyncThunk(
  'custom/fetchOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await customAPI.getMyOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch custom orders');
    }
  }
);

export const fetchCustomOrder = createAsyncThunk(
  'custom/fetchOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await customAPI.getOrder(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch custom order');
    }
  }
);

// Initial state
const initialState = {
  customOrders: [],
  currentOrder: null,
  loading: false,
  error: null,
  // Customizer state
  uploadedImage: null,
  canvas: null,
  designData: null,
  mockupUrl: null,
  transformations: {
    scale: 1,
    rotation: 0,
    position: { x: 0, y: 0 },
  },
  customizerLoading: false,
};

const customSlice = createSlice({
  name: 'custom',
  initialState,
  reducers: {
    setUploadedImage: (state, action) => {
      state.uploadedImage = action.payload;
    },
    setCanvas: (state, action) => {
      state.canvas = action.payload;
    },
    setDesignData: (state, action) => {
      state.designData = action.payload;
    },
    setMockupUrl: (state, action) => {
      state.mockupUrl = action.payload;
    },
    setTransformations: (state, action) => {
      state.transformations = { ...state.transformations, ...action.payload };
    },
    resetCustomizer: (state) => {
      state.uploadedImage = null;
      state.canvas = null;
      state.designData = null;
      state.mockupUrl = null;
      state.transformations = {
        scale: 1,
        rotation: 0,
        position: { x: 0, y: 0 },
      };
    },
    setCustomizerLoading: (state, action) => {
      state.customizerLoading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Custom Order
      .addCase(createCustomOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.customOrders.unshift(action.payload.customOrder);
        state.error = null;
      })
      .addCase(createCustomOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Custom Payment
      .addCase(createCustomPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomPayment.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createCustomPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify Custom Payment
      .addCase(verifyCustomPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyCustomPayment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customOrders.findIndex(
          order => order._id === action.payload.customOrder._id
        );
        if (index !== -1) {
          state.customOrders[index] = action.payload.customOrder;
        }
        state.error = null;
      })
      .addCase(verifyCustomPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Custom Orders
      .addCase(fetchCustomOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.customOrders = action.payload.customOrders;
        state.error = null;
      })
      .addCase(fetchCustomOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Single Custom Order
      .addCase(fetchCustomOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.customOrder;
        state.error = null;
      })
      .addCase(fetchCustomOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setUploadedImage,
  setCanvas,
  setDesignData,
  setMockupUrl,
  setTransformations,
  resetCustomizer,
  setCustomizerLoading,
  clearError,
} = customSlice.actions;

// Selectors
export const selectCustomOrders = (state) => state.custom.customOrders;
export const selectCurrentCustomOrder = (state) => state.custom.currentOrder;
export const selectCustomLoading = (state) => state.custom.loading;
export const selectCustomError = (state) => state.custom.error;
export const selectUploadedImage = (state) => state.custom.uploadedImage;
export const selectCanvas = (state) => state.custom.canvas;
export const selectDesignData = (state) => state.custom.designData;
export const selectMockupUrl = (state) => state.custom.mockupUrl;
export const selectTransformations = (state) => state.custom.transformations;
export const selectCustomizerLoading = (state) => state.custom.customizerLoading;

export default customSlice.reducer;