import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

// withCredentials: true ensures the HTTP-only session cookie is sent/received
const API = axios.create({ baseURL: '/api', withCredentials: true });

API.interceptors.request.use(config => {
  // Keep Bearer header as fallback for any context that still has the token
  const token = localStorage.getItem('af_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load user — works via HTTP-only cookie session or stored token
  const loadUser = useCallback(async () => {
    try {
      const { data } = await API.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('af_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  // Auto-show auth modal after 4 seconds if not logged in
  useEffect(() => {
    if (!loading && !user) {
      const timer = setTimeout(() => setShowAuthModal(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    // Store token in localStorage as a fallback (cookie is the primary auth)
    if (data.token) localStorage.setItem('af_token', data.token);
    setUser(data.user);
    setShowAuthModal(false);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password });
    if (data.token) localStorage.setItem('af_token', data.token);
    setUser(data.user);
    setShowAuthModal(false);
    return data.user;
  };

  const googleLogin = async (googleData) => {
    const { data } = await API.post('/auth/google', googleData);
    if (data.token) localStorage.setItem('af_token', data.token);
    setUser(data.user);
    setShowAuthModal(false);
    return data.user;
  };

  const logout = async () => {
    try {
      // Destroy server-side session and clear the HTTP-only cookie
      await API.post('/auth/logout');
    } catch {
      // Continue with client-side cleanup even if server call fails
    }
    localStorage.removeItem('af_token');
    localStorage.removeItem('af_orders');
    localStorage.removeItem('af_products');
    localStorage.removeItem('af_cart');
    localStorage.removeItem('af_wishlist');
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const { data } = await API.post('/auth/forgot-password', { email });
    return data;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const { data } = await API.post('/auth/reset-password', { email, otp, newPassword });
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, showAuthModal, setShowAuthModal,
      login, register, googleLogin, logout,
      forgotPassword, resetPassword,
      isAdmin: user?.role === 'admin',
      isEmployee: user?.role === 'employee',
      canAccessAdmin: user?.role === 'admin' || user?.role === 'employee',
      isLoggedIn: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
