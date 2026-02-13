import axios from 'axios';

// v3: Stratavore HTTP API client
// Base URL is /api/v1 — nginx proxies this to the Stratavore daemon
export const stratavoreApi = axios.create({
  baseURL: (import.meta as any).env?.VITE_STRATAVORE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

stratavoreApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[stratavore]', error.config?.url, error.message);
    return Promise.reject(error);
  }
);

// Legacy api instance — kept temporarily while old pages are removed
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
