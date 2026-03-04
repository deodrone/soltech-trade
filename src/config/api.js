import axios from 'axios';
import { auth } from './firebase';
import store from '../store';
import { useToast } from '../composables/useToast';

const { show: showToast } = useToast();

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:5000'
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Queue of { resolve, reject } callbacks waiting on a token refresh
let queue = [];

const flushQueue = (token, error) => {
  queue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  queue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Another refresh is already in flight — queue this request
    if (store.getters.tokenRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    store.commit('SET_TOKEN_REFRESHING', true);

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error('No user');
      original.headers.Authorization = `Bearer ${token}`;
      flushQueue(token, null);
      return api(original);
    } catch (refreshError) {
      flushQueue(null, refreshError);
      showToast({ message: 'Your session has expired. Please sign in again.', type: 'warning', duration: 5000 });
      await auth.signOut();
      setTimeout(() => { window.location.href = '/login'; }, 1500);
      return Promise.reject(refreshError);
    } finally {
      store.commit('SET_TOKEN_REFRESHING', false);
    }
  }
);

export default api;
