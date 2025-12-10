// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/me',
    UPDATE_PROFILE: '/auth/profile',
    ADD_ADDRESS: '/auth/address',
    DELETE_ADDRESS: (id) => `/auth/address/${id}`,
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
    ADD_VARIANT: (id) => `/products/${id}/variants`,
    UPDATE_VARIANT: (productId, variantId) => `/products/${productId}/variants/${variantId}`,
    DELETE_VARIANT: (productId, variantId) => `/products/${productId}/variants/${variantId}`,
  },
  ORDERS: {
    CREATE: '/orders',
    MY_ORDERS: '/orders/my',
    DETAIL: (id) => `/orders/${id}`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    CREATE_PAYMENT: '/orders/pay/create',
    VERIFY_PAYMENT: '/orders/pay/verify',
  },
  CUSTOM: {
    CREATE_ORDER: '/custom/order',
    MY_ORDERS: '/custom/orders',
    DETAIL: (id) => `/custom/orders/${id}`,
    CREATE_PAYMENT: '/custom/pay',
    VERIFY_PAYMENT: '/custom/pay/verify',
  },
  UPLOADS: {
    IMAGE: '/uploads/image',
    BASE64: '/uploads/base64',
    PRODUCT_IMAGE: (productId, variantId) => `/uploads/product/${productId}/variant/${variantId}`,
    MOCKUP: (productId) => `/uploads/mockup/${productId}`,
    DELETE: (publicId) => `/uploads/${publicId}`,
  },
  ADMIN: {
    ORDERS: '/admin/orders',
    UPDATE_ORDER_STATUS: (id) => `/admin/orders/${id}/status`,
    CUSTOM_ORDERS: '/admin/custom-orders',
    APPROVE_CUSTOM_ORDER: (id) => `/admin/custom/${id}/approve`,
    REJECT_CUSTOM_ORDER: (id) => `/admin/custom/${id}/reject`,
    UPDATE_CUSTOM_ORDER_STATUS: (id) => `/admin/custom/${id}/status`,
  },
};

// Product types
export const PRODUCT_TYPES = {
  GLOSSY_METAL: 'Glossy Metal',
  GLOSSY_METAL_GEL: 'Glossy Metal + Gel',
};

// Product categories
export const PRODUCT_CATEGORIES = {
  DESIGNER: 'Designer',
  PLAIN: 'Plain',
  CUSTOMIZABLE: 'Customizable',
};

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Custom order status
export const CUSTOM_ORDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PRODUCTION: 'in_production',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  DEFAULT_ADMIN_LIMIT: 20,
};

// Sort options
export const SORT_OPTIONS = {
  NEWEST: '-createdAt',
  OLDEST: 'createdAt',
  PRICE_LOW: 'variants.price',
  PRICE_HIGH: '-variants.price',
  NAME_AZ: 'title',
  NAME_ZA: '-title',
};

// Filter options
export const FILTER_OPTIONS = {
  BRANDS: ['Apple', 'Samsung', 'OnePlus', 'Google', 'Xiaomi', 'Realme'],
  TYPES: [PRODUCT_TYPES.GLOSSY_METAL, PRODUCT_TYPES.GLOSSY_METAL_GEL],
  CATEGORIES: [PRODUCT_CATEGORIES.DESIGNER, PRODUCT_CATEGORIES.PLAIN, PRODUCT_CATEGORIES.CUSTOMIZABLE],
};

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  CURRENCY: 'INR',
  LOCALE: 'en',
  THEME: {
    color: '#2563eb',
  },
};

// Toast messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful!',
    REGISTER: 'Registration successful!',
    LOGOUT: 'Logged out successfully!',
    ADD_TO_CART: 'Item added to cart!',
    REMOVE_FROM_CART: 'Item removed from cart!',
    ORDER_CREATED: 'Order created successfully!',
    PAYMENT_SUCCESS: 'Payment completed successfully!',
    PROFILE_UPDATED: 'Profile updated successfully!',
    ADDRESS_ADDED: 'Address added successfully!',
    CUSTOM_ORDER_CREATED: 'Custom order created successfully!',
    DESIGN_UPLOADED: 'Design uploaded successfully!',
  },
  ERROR: {
    LOGIN_FAILED: 'Login failed. Please try again.',
    REGISTER_FAILED: 'Registration failed. Please try again.',
    ADD_TO_CART_FAILED: 'Failed to add item to cart.',
    ORDER_FAILED: 'Failed to create order.',
    PAYMENT_FAILED: 'Payment failed. Please try again.',
    UPLOAD_FAILED: 'Failed to upload image.',
    VALIDATION_ERROR: 'Please check all required fields.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Please login to continue.',
    FORBIDDEN: 'You do not have permission to perform this action.',
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  CART: 'cart',
  USER_PREFERENCES: 'user_preferences',
  RECENTLY_VIEWED: 'recently_viewed',
};

// Animation durations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};