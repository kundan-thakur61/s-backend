import { configureStore } from '@reduxjs/toolkit';
import productSlice from './slices/productSlice';
import customSlice from './slices/customSlice';
import cartSlice from './slices/cartSlice';
import authSlice from './slices/authSlice';
import adminOrderSlice from './slices/adminOrderSlice';
import adminCustomOrderSlice from './slices/adminCustomOrderSlice';
import adminUserSlice from './slices/adminUserSlice';
import adminDashboardSlice from './slices/adminDashboardSlice';
import wishlistSlice from './slices/wishlistSlice';

export const store = configureStore({
  reducer: {
    products: productSlice,
    custom: customSlice,
    cart: cartSlice,
    auth: authSlice,
    adminOrders: adminOrderSlice,
    adminCustomOrders: adminCustomOrderSlice,
    adminUsers: adminUserSlice,
    adminDashboard: adminDashboardSlice,
    wishlist: wishlistSlice,
  },
});

export default store;
