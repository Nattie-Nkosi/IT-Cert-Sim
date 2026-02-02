import axios, { AxiosError } from 'axios';
import { useAuthStore } from './store';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
const API_URL = isTauri
  ? 'http://localhost:3002/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(async (config) => {
  const state = useAuthStore.getState();

  if (state.token && state.isTokenExpired() && state.refreshToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: state.refreshToken,
        });
        const { token, refreshToken, expiresIn } = response.data;
        state.setTokens(token, refreshToken, expiresIn);
        processQueue(null, token);
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        processQueue(error, null);
        state.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } finally {
        isRefreshing = false;
      }
    } else {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(config);
          },
          reject: (err: any) => {
            reject(err);
          },
        });
      });
    }
  } else if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const state = useAuthStore.getState();

      if (state.refreshToken && !isRefreshing) {
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: state.refreshToken,
          });
          const { token, refreshToken, expiresIn } = response.data;
          state.setTokens(token, refreshToken, expiresIn);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          state.logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
