import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { api } from '@/lib/api';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/storage';
import type { User } from '@/lib/types';

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  requestEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = useCallback(async () => {
    setIsLoading(true);
    const storedToken = await getStoredToken();

    if (!storedToken) {
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.getMe(storedToken);
      setToken(storedToken);
      setUser(me);
    } catch {
      await clearStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const applyAuth = useCallback(async (nextToken: string, nextUser: User) => {
    await setStoredToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.login(email, password);
      await applyAuth(response.accessToken, response.user);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const response = await api.register(email, password);
      await applyAuth(response.accessToken, response.user);
    },
    [applyAuth],
  );

  const requestEmailCode = useCallback(async (email: string) => {
    await api.requestEmailCode(email);
  }, []);

  const verifyEmailCode = useCallback(
    async (email: string, code: string) => {
      const response = await api.verifyEmailCode(email, code);
      await applyAuth(response.accessToken, response.user);
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }

    const me = await api.getMe(token);
    setUser(me);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      login,
      register,
      requestEmailCode,
      verifyEmailCode,
      logout,
      refreshUser,
    }),
    [
      isLoading,
      login,
      logout,
      refreshUser,
      register,
      requestEmailCode,
      token,
      user,
      verifyEmailCode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
