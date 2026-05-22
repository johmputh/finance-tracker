import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserResponse } from "@finance-tracker/shared";
import { api } from "./api";

interface AuthContextValue {
  token: string | null;
  user: UserResponse | null;
  login: (token: string, user: UserResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<UserResponse | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? (JSON.parse(stored) as UserResponse) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token && !user) {
      api
        .getMe()
        .then((u) => {
          setUser(u);
          localStorage.setItem("user", JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
        });
    }
  }, [token, user]);

  const login = (t: string, u: UserResponse) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
