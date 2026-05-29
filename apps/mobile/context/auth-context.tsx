import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, clearAuth, getAccessToken, login, register, type ApiUser } from "@/lib/api";

type AuthContextValue = {
  user: ApiUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    const token = await getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const data = await apiFetch<{ ok: true; user: ApiUser }>("/auth/me").catch(
        () => null,
      );
      if (data?.user) setUser(data.user);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiFetch<{ ok: true; user: ApiUser }>("/auth/me");
        setUser(data.user);
      } catch {
        await clearAuth();
        setUser(null);
      }
      setLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        const u = await login(email, password);
        setUser(u);
      },
      async signUp(input) {
        const u = await register(input);
        setUser(u);
      },
      async signOut() {
        await clearAuth();
        setUser(null);
      },
      refreshProfile,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
