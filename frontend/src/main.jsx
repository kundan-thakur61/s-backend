import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
// import themeAPI from './api/themeAPI'

// Load active theme from API and apply CSS variables on startup
// async function applyActiveTheme() {
//   try {
//     const res = await themeAPI.getActive();
//     const t = res?.data?.data?.theme;
//     if (t && t.variables) {
//       const root = document.documentElement;
//       Object.keys(t.variables).forEach(key => {
//         try { root.style.setProperty(key, t.variables[key]); } catch (e) { /* ignore */ }
//       });
//     }
//   } catch (err) {
//     // ignore - app works without theme
//     // console.warn('Failed to load active theme', err);
//   }
// }

// applyActiveTheme();

// Listen for global unauthorized events from the API client and centralize logout
window.addEventListener('app:unauthorized', () => {
  try {
    // Dispatch the slice action by type to avoid additional imports and circular deps
    store.dispatch({ type: 'auth/logout' });
  } catch (e) {
    // ignore
  }
  // Navigate to login page
  window.location.href = '/login';
});

// Auth state is preloaded into the store from `store.js` (no startup dispatch here).

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)