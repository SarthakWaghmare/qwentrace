import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('qt_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('qt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
