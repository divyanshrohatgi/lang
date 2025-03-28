import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status using the getMe endpoint
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // getMe returns user in "data"
      setUser(res.data.data);
    } catch (err) {
      console.error('Authentication check failed:', err);
      localStorage.removeItem('token');
      setUser(null);
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Login using the login endpoint (which returns user under "user")
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      // Use res.data.user per backend response from login
      setUser(res.data.user);

      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Register using the register endpoint (which returns user under "user")
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post('/api/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      // Use res.data.user per backend response from register
      setUser(res.data.user);

      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile using the updateDetails endpoint
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const res = await axios.put('/api/users', userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // updateDetails returns user under "data"
      setUser(res.data.data);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      return { success: false, error: err.response?.data?.message || 'Profile update failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Setup axios interceptors
  useEffect(() => {
    // Add request interceptor to include token with every request
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle 401 errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors when the component unmounts
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    checkAuth,
    login,
    register,
    updateProfile,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
