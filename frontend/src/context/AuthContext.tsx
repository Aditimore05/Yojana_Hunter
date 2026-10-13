"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, LoginCredentials, RegisterData } from "@/types/auth";
import { UserProfile } from "@/types/profile";
import { 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout, 
  getCurrentUser, 
  getStoredUser, 
  isLoggedIn as checkIsLoggedIn 
} from "@/services/authService";
import { getStoredProfile, saveStoredProfile } from "@/lib/storage";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfileState: (newProfile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize from storage and verify session with backend
  useEffect(() => {
    async function initAuth() {
      if (checkIsLoggedIn()) {
        const stored = getStoredUser();
        const storedProf = getStoredProfile();
        if (stored) {
          setUser(stored);
          setProfile(storedProf);
        }

        try {
          const remote = await getCurrentUser();
          if (remote.user) {
            setUser(remote.user);
            if (remote.profile) {
              setProfile(remote.profile);
            }
          } else {
            setUser(null);
          }
        } catch {
          // If network is offline, keep stored session
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    const res = await apiLogin(credentials);
    if (res.success && res.data) {
      setUser(res.data.user);
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: res.error };
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    const res = await apiRegister(data);
    if (res.success && res.data) {
      setUser(res.data.user);
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: res.error };
  };

  const logout = async () => {
    setLoading(true);
    await apiLogout();
    setUser(null);
    setLoading(false);
  };

  const refreshUser = async () => {
    if (checkIsLoggedIn()) {
      const remote = await getCurrentUser();
      if (remote.user) {
        setUser(remote.user);
        if (remote.profile) {
          setProfile(remote.profile);
        }
      }
    }
  };

  const updateProfileState = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveStoredProfile(newProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
