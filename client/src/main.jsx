import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { store } from './store/index.js';
import { logout, fetchMe } from './store/authSlice.js';
import { setupInterceptors } from './api/axios.js';
import './styles.css';

// Global 401 handling: expired/invalid token logs the user out everywhere
setupInterceptors(() => store.dispatch(logout()));

// Restore session if a token is stored
if (localStorage.getItem('token')) store.dispatch(fetchMe());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
