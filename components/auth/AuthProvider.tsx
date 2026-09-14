"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type ApiUser } from "@/lib/api";

type AuthState = {
  user: ApiUser | null;
  loading: boolean;
  login: (user: ApiUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    // Token endi httpOnly cookie'da — JS uni ko'ra olmaydi, shuning uchun
    // avvaldan tekshirmasdan to'g'ridan-to'g'ri so'rov yuboramiz.
    // Cookie yo'q/eskirgan bo'lsa `me()` shunchaki 401 bilan yiqiladi.
    try {
      setUser(await api.me());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Cookie login route handler'ning javobi natijasida allaqachon o'rnatilgan —
  // bu yerda faqat local state yangilanadi.
  const login = useCallback((nextUser: ApiUser) => {
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return context;
}
