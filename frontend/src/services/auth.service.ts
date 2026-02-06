import api from './api';
import { User } from '../types';

export interface SetupRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export const authService = {
  async setup(data: SetupRequest): Promise<{ user: User }> {
    const response = await api.post('/auth/setup', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<{ user: User }> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
