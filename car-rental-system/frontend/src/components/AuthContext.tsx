'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearToken,
  getStoredUser,
  getToken,
  loginUser,
  registerUser,
  setStoredUser,
  setToken,
} from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // We hydrate from localStorage on mount (client-only).
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser<User>();
    const storedToken = getToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setTokenState(storedToken);
    }
    setIsReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginUser(email, password);
    setUser(data.user);
    setTokenState(data.token);
    setToken(data.token);
    setStoredUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const data = await registerUser(payload);
      setUser(data.user);
      setTokenState(data.token);
      setToken(data.token);
      setStoredUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setTokenState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) return;
    try {
      // Lazy import to avoid a circular dep at module load.
      const { fetchCurrentUser } = await import('@/lib/api');
      const fresh = await fetchCurrentUser<User>();
      setUser(fresh);
      setStoredUser(fresh);
    } catch {
      // Token invalid → clear local state silently.
      clearToken();
      setUser(null);
      setTokenState(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isReady, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside <AuthProvider>');
  }
  return ctx;
}
