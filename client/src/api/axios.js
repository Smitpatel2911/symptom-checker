import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000, // free-tier backends can take a while to wake up
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Called once from main.jsx. On 401 for an authenticated session (expired/invalid
// token) we log the user out globally. Login failures are left to the form.
export function setupInterceptors(onUnauthorized) {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const isAuthAttempt = error.config?.url?.includes('/auth/login');
      if (error.response?.status === 401 && !isAuthAttempt && localStorage.getItem('token')) {
        onUnauthorized();
      }
      return Promise.reject(error);
    }
  );
}

// One place to turn any Axios error into a readable message
export function getErrorMessage(error) {
  return (
    error.response?.data?.errors?.[0]?.message ||
    error.response?.data?.message ||
    (error.code === 'ECONNABORTED' ? 'The server took too long to respond. Please try again.' : null) ||
    (error.request ? 'Cannot reach the server. Check your connection.' : null) ||
    error.message ||
    'Something went wrong'
  );
}

export default api;
