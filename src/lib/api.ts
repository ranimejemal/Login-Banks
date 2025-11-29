import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  signup: async (email: string, password: string, fullName: string) => {
    const { data } = await api.post('/api/auth/signup', {
      email,
      password,
      fullName,
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  signin: async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/signin', {
      email,
      password,
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};

export const user = {
  getProfile: async () => {
    const { data } = await api.get('/api/user/profile');
    return data;
  },

  getAccounts: async () => {
    const { data } = await api.get('/api/accounts');
    return data;
  },

  getTransactions: async (accountId: number) => {
    const { data } = await api.get(`/api/transactions/${accountId}`);
    return data;
  },
};
