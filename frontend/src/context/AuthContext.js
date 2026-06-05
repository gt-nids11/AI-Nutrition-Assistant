'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('nutrimate_token');
      if (!token) {
        setLoading(false);
        // Protect all pages except login/register
        if (pathname !== '/login' && pathname !== '/register') {
          router.push('/login');
        }
        return;
      }

      try {
        const data = await authAPI.getMe();
        if (data.success) {
          setUser(data.user);
          
          // If profile is missing and not on onboarding page, force onboard
          if (!data.user.hasProfile && pathname !== '/onboarding') {
            router.push('/onboarding');
          } else if (data.user.hasProfile && (pathname === '/login' || pathname === '/register')) {
            router.push('/');
          }
        } else {
          logout();
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, [pathname]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      if (data.success) {
        localStorage.setItem('nutrimate_token', data.token);
        setUser({
          _id: data._id,
          name: data.name,
          email: data.email,
          hasProfile: data.hasProfile
        });
        
        if (!data.hasProfile) {
          router.push('/onboarding');
        } else {
          router.push('/');
        }
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await authAPI.register(name, email, password);
      if (data.success) {
        localStorage.setItem('nutrimate_token', data.token);
        setUser({
          _id: data._id,
          name: data.name,
          email: data.email,
          hasProfile: false
        });
        router.push('/onboarding');
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('nutrimate_token');
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const data = await authAPI.getMe();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error refreshing user status:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
