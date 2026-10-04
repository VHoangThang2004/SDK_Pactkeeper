import axios from 'axios';
import { ApiConfig } from './apiConfig';
import { StorageService } from '../services/storageService';

export const apiClient = axios.create({
  baseURL: ApiConfig.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = StorageService.getToken();
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`API Error: ${error.response?.status} - ${error.message}`);
    if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/')) {
      StorageService.clearAuthData();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
