// Global Authentication Context & Provider with Backend API Integration
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, LoginCredentials } from '../types';
import { api } from '../services/api';
import { DEMO_USERS, DEMO_CREDENTIALS } from '../data/mockData';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('tpm_token');
    const storedUser = localStorage.getItem('tpm_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('tpm_token');
        localStorage.removeItem('tpm_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      // 1. Try real backend API login
      const res = await api.login(credentials);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('tpm_token', res.token);
      localStorage.setItem('tpm_user', JSON.stringify(res.user));
    } catch (apiErr: any) {
      // If server responded with a specific error message (e.g. Invalid password), throw it directly
      if (apiErr.message && apiErr.message !== 'Failed to fetch' && apiErr.message !== 'Login failed') {
        throw new Error(apiErr.message);
      }

      // 2. Demo mode fallback ONLY if server is completely unreachable (Network Error)
      const expectedPassword = DEMO_CREDENTIALS[credentials.email];
      if (!expectedPassword || expectedPassword !== credentials.password) {
        throw new Error(apiErr.message || 'Invalid email or password');
      }

      const foundUser = DEMO_USERS.find(u => u.email === credentials.email);
      if (!foundUser) throw new Error('User not found');

      const mockToken = btoa(JSON.stringify({ id: foundUser.id, role: foundUser.role, exp: Date.now() + 86400000 }));
      const authUser: AuthUser = {
        id: foundUser.id,
        email: foundUser.email,
        full_name: foundUser.full_name,
        role: foundUser.role,
        department_id: foundUser.department_id,
      };

      setToken(mockToken);
      setUser(authUser);
      localStorage.setItem('tpm_token', mockToken);
      localStorage.setItem('tpm_user', JSON.stringify(authUser));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('tpm_token');
    localStorage.removeItem('tpm_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
