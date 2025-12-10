import { createSlice } from '@reduxjs/toolkit';

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const cart = localStorage.getItem('cart');
    const images = localStorage.getItem('cartImages');
    const parsedCart = cart ? JSON.parse(cart) : { items: [], total: 0 };
    const parsedImages = images ? JSON.parse(images) : {};

    // Restore imgSrc to designs
    parsedCart.items = parsedCart.items.map(item => {
      if (item.product.design && !item.product.design.imgSrc && parsedImages[item.product._id]) {
        item.product.design.imgSrc = parsedImages[item.product._id];
      }
      return item;
    });

    return parsedCart;
  } catch (error) {
    return { items: [], total: 0 };
  }
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  try {
    // Create a copy of the cart without imgSrc in designs to reduce storage size
    const cartCopy = {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          design: item.product.design ? {
            ...item.product.design,
            imgSrc: undefined // Remove imgSrc to reduce size
          } : item.product.design
        }
      }))
    };

    localStorage.setItem('cart', JSON.stringify(cartCopy));

    // Try to store imgSrc separately, but handle quota exceeded gracefully
    try {
      const images = {};
      cart.items.forEach(item => {
        if (item.product.design && item.product.design.imgSrc) {
          images[item.product._id] = item.product.design.imgSrc;
        }
      });
      localStorage.setItem('cartImages', JSON.stringify(images));
    } catch (imageError) {
      // If storing images exceeds quota, clear any existing images and don't store new ones
      console.warn('Cart images too large for localStorage, thumbnails will show placeholders');
      try {
        localStorage.removeItem('cartImages');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const initialState = loadCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, variant, quantity = 1 } = action.payload;
      
      const existingItem = state.items.find(
        item => item.product._id === product._id && item.variant._id === variant._id
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          product,
          variant,
          quantity,
        });
      }

      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.variant.price * item.quantity),
        0
      );

      saveCartToStorage(state);
    },

    removeFromCart: (state, action) => {
      const { productId, variantId } = action.payload;
      
      state.items = state.items.filter(
        item => !(item.product._id === productId && item.variant._id === variantId)
      );

      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.variant.price * item.quantity),
        0
      );

      saveCartToStorage(state);
    },

    updateQuantity: (state, action) => {
      const { productId, variantId, quantity } = action.payload;
      
      const item = state.items.find(
        item => item.product._id === productId && item.variant._id === variantId
      );

      if (item) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.items = state.items.filter(
            item => !(item.product._id === productId && item.variant._id === variantId)
          );
        } else {
          item.quantity = quantity;
        }

        // Recalculate total
        state.total = state.items.reduce(
          (sum, item) => sum + (item.variant.price * item.quantity),
          0
        );

        saveCartToStorage(state);
      }

    },

    updateDesign: (state, action) => {
      // action.payload: { productId, design }
      const { productId, design } = action.payload;
      const item = state.items.find(i => i.product && i.product._id === productId);
      if (item) {
        item.product = { ...item.product, design };

        // Recalculate total (design doesn't affect price but we re-save)
        state.total = state.items.reduce(
          (sum, it) => sum + (it.variant.price * it.quantity),
          0
        );

        saveCartToStorage(state);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      try {
        localStorage.removeItem('cart');
        localStorage.removeItem('cartImages');
      } catch (error) {
        console.error('Failed to clear cart from localStorage:', error);
      }
    },

    loadCart: (state) => {
      const savedCart = loadCartFromStorage();
      state.items = savedCart.items;
      state.total = savedCart.total;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, updateDesign, clearCart, loadCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartItemCount = (state) => 
  state.cart.items.reduce((count, item) => count + item.quantity, 0);

export const selectCartItem = (productId, variantId) => (state) =>
  state.cart.items.find(
    item => item.product._id === productId && item.variant._id === variantId
  );

export default cartSlice.reducer;