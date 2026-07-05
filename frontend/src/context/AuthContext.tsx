import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../lib/axios";

interface BuildingRef {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  building?: BuildingRef | string | null;
  avatar?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
}

// Helper: always returns the building _id string (or "" if none)
export function getBuildingId(user: User | null): string {
  if (!user?.building) return "";
  if (typeof user.building === "string") return user.building;
  return user.building._id || "";
}

// Helper: returns the building name (or "" if none)
export function getBuildingName(user: User | null): string {
  if (!user?.building) return "";
  if (typeof user.building === "object") return user.building.name || "";
  return "";
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      api.get("/auth/me")
        .then(({ data }) => setUser(data.data))
        .catch(() => localStorage.removeItem("accessToken"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.data.accessToken);
    setUser(data.data.user);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
