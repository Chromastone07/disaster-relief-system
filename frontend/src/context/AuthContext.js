import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On load, attempt to fetch user info if token exists
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Assuming /auth/me exists in backend, if not, we emulate or extract from JWT
          // For now, we fetch from /auth/users/me (Standard FastAPI OAuth2 behavior)
          const response = await apiClient.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch user, token may be invalid/expired");
          localStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (emailOrUsername, password) => {
    // Send pure JSON instead of formData based on UserLogin schema in FastAPI
    const response = await apiClient.post('/auth/login', {
      email: emailOrUsername,
      password: password
    });
    
    // Store exact string format matching backend schema
    localStorage.setItem('access_token', response.data.access_token);
    
    // Now fetch the actual user object
    const userRes = await apiClient.get('/auth/me');
    setUser(userRes.data);
    return userRes.data;
  };

  const register = async (email, username, password, role = "civilian") => {
    const response = await apiClient.post('/auth/register', {
      email: email, 
      name: username, 
      password: password, 
      role: role
    });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value = {
    user,
    token: localStorage.getItem('access_token'),
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
