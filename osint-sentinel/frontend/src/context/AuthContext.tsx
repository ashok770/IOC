import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export interface User {
  id: string;
  email: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const userData = await apiClient.get<User>('v1/auth/me');
      setUser(userData);
    } catch (error) {
      // 401 means not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // In development, we can redirect to /v1/auth/dev-login if configured, or standard login
    // Let's redirect to standard login, the backend can handle dev-login independently if we want to manually hit it.
    // However, for automated testing / easy dev, hitting dev-login is easiest. 
    // We will just redirect to dev-login in development, otherwise login.
    const isDev = import.meta.env.MODE === 'development';
    window.location.href = isDev ? '/api/v1/auth/dev-login' : '/api/v1/auth/login';
  };

  const logout = async () => {
    try {
      await apiClient.post('v1/auth/logout');
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
