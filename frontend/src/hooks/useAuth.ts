import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { user } = await authService.me();
      setUser(user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const { user } = await authService.login({ username, password });
    setUser(user);
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return {
    user,
    loading,
    login,
    logout,
  };
}
