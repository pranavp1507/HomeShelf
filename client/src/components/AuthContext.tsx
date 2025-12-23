import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { isTokenExpired } from '../utils/tokenValidation';

interface AuthContextType {
  token: string | null;
  user: { id: number; username: string; role: string } | null;
  login: (token: string, user: { id: number; username: string; role: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);

  // Memoized logout function to prevent dependency issues
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Validate token on initialization
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // Check for non-null and non-"undefined" string before parsing
    if (storedToken && storedUser && storedUser !== 'undefined') {
      try {
        // Validate token expiration
        if (isTokenExpired(storedToken)) {
          console.log('Token expired on load, clearing authentication');
          logout();
          return;
        }

        const userObject = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userObject);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        // Clear corrupted storage
        logout();
      }
    }
  }, [logout]);

  // Periodic token validation - check every minute
  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(() => {
      if (isTokenExpired(token)) {
        console.log('Token expired during session, logging out');
        logout();
        // Redirect to login page
        window.location.href = '/login';
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(intervalId);
  }, [token, logout]);

  const login = (newToken: string, newUser: { id: number; username: string; role: string }) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
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
