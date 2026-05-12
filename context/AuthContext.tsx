import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'mua_auth_token';

export interface StoredAuth {
  access_token: string;
  role: 'admin' | 'user';
  username: string;
}

interface AuthContextValue {
  user: StoredAuth | null;
  login: (u: StoredAuth) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadFromStorage(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredAuth | null>(loadFromStorage);

  const login = useCallback((u: StoredAuth) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('mua:logout', handler);
    return () => window.removeEventListener('mua:logout', handler);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
