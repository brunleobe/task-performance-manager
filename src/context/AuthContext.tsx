import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthUser, LoginCredentials } from '../types';
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
    // Restore session from localStorage
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
    // --- Demo Mode: validate against mock data ---
    // Replace this block with a real API call when the backend is ready:
    // const res = await axios.post('/api/auth/login', credentials);
    // const { token, user } = res.data;

    const expectedPassword = DEMO_CREDENTIALS[credentials.email];
    if (!expectedPassword || expectedPassword !== credentials.password) {
      throw new Error('Invalid email or password');
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
