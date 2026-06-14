import ApiService from '@/services/ApiService';
import SecureStorage from '@/services/SecureStorage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, password: string, passwordConfirmation: string, token: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();

    ApiService.setOnUnauthenticated(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const data = await ApiService.getUser();
          setUser(data?.user ?? data ?? null);
        } catch {
          await SecureStorage.removeItem('auth_token');
          setToken(null);
        }
      }
    } catch {
      console.error('Error loading auth');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await ApiService.login(email, password);
    if (!data?.token) throw new Error('Login failed — no token received.');
    setToken(data.token);
    setUser(data.user ?? null);
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    const data = await ApiService.register(name, email, password, passwordConfirmation);
    if (!data?.token) throw new Error('Registration failed — no token received.');
    setToken(data.token);
    setUser(data.user ?? null);
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch {
      console.error('Logout error');
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const forgotPassword = async (email: string) => {
    return ApiService.forgotPassword(email);
  };

  const resetPassword = async (email: string, password: string, passwordConfirmation: string, token: string) => {
    return ApiService.resetPassword(email, password, passwordConfirmation, token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);
}
