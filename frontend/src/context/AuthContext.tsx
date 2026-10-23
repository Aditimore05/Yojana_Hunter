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
import { 
  getStoredProfile, 
  saveStoredProfile, 
  getActiveProfileId, 
  setActiveProfileId,
  getStoredProfilesList,
  saveStoredProfilesList
} from "@/lib/storage";
import { fetchProfiles, fetchProfile } from "@/services/profileService";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  familyProfiles: UserProfile[];
  activeProfileId: number | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfileState: (newProfile: UserProfile) => void;
  switchActiveProfile: (profileOrId: UserProfile | number) => Promise<void>;
  refreshFamilyProfiles: () => Promise<UserProfile[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [familyProfiles, setFamilyProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize from storage and verify session with backend
  useEffect(() => {
    async function initAuth() {
      if (checkIsLoggedIn()) {
        const stored = getStoredUser();
        const storedProf = getStoredProfile();
        const storedList = getStoredProfilesList();
        const storedActiveId = getActiveProfileId();

        if (stored && stored.role !== 'admin') {
          setUser(stored);
          setProfile(storedProf);
          setFamilyProfiles(storedList);
          setActiveProfileIdState(storedActiveId);
        } else {
          setUser(null);
          setProfile(null);
          setFamilyProfiles([]);
        }

        try {
          const remote = await getCurrentUser();
          if (remote.user && remote.user.role !== 'admin') {
            setUser(remote.user);
            
            // Fetch all family profiles from backend
            const remoteProfiles = await fetchProfiles();
            if (remoteProfiles && remoteProfiles.length > 0) {
              setFamilyProfiles(remoteProfiles);
              saveStoredProfilesList(remoteProfiles);

              // Find active profile
              const active = (storedActiveId && remoteProfiles.find(p => p.id === storedActiveId))
                || remoteProfiles.find(p => p.relationship === "Self")
                || remoteProfiles[0];

              if (active) {
                setProfile(active);
                saveStoredProfile(active);
                if (active.id) {
                  setActiveProfileId(active.id);
                  setActiveProfileIdState(active.id);
                }
              }
            } else if (remote.profile) {
              setProfile(remote.profile);
              setFamilyProfiles([remote.profile]);
            }
          } else {
            setUser(null);
            setProfile(null);
            setFamilyProfiles([]);
          }
        } catch {
          // If network is offline, keep stored session
        }
      } else {
        setUser(null);
        setProfile(null);
        setFamilyProfiles([]);
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const refreshFamilyProfiles = async (): Promise<UserProfile[]> => {
    const list = await fetchProfiles();
    if (list && list.length > 0) {
      setFamilyProfiles(list);
      saveStoredProfilesList(list);

      // Verify active profile is still in list
      const currentActiveId = getActiveProfileId();
      const currentActive = list.find(p => p.id === currentActiveId) 
        || list.find(p => p.relationship === "Self") 
        || list[0];

      if (currentActive) {
        setProfile(currentActive);
        saveStoredProfile(currentActive);
        if (currentActive.id) {
          setActiveProfileId(currentActive.id);
          setActiveProfileIdState(currentActive.id);
        }
      }
      return list;
    }
    return [];
  };

  const switchActiveProfile = async (profileOrId: UserProfile | number) => {
    let targetProfile: UserProfile | undefined;
    if (typeof profileOrId === "number") {
      targetProfile = familyProfiles.find(p => p.id === profileOrId);
      if (!targetProfile) {
        // Fetch from backend
        targetProfile = await fetchProfile(profileOrId);
      }
    } else {
      targetProfile = profileOrId;
    }

    if (targetProfile) {
      setProfile(targetProfile);
      saveStoredProfile(targetProfile);
      if (targetProfile.id) {
        setActiveProfileId(targetProfile.id);
        setActiveProfileIdState(targetProfile.id);
      }
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    const res = await apiLogin(credentials);
    if (res.success && res.data) {
      if (res.data.user.role === 'admin') {
        setLoading(false);
        return { success: false, error: 'Administrator accounts must sign in via the Admin Portal.' };
      }
      setUser(res.data.user);
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
      await refreshFamilyProfiles();
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
      await refreshFamilyProfiles();
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: res.error };
  };

  const logout = async () => {
    setLoading(true);
    await apiLogout();
    setActiveProfileId(null);
    setUser(null);
    setProfile(null);
    setFamilyProfiles([]);
    setActiveProfileIdState(null);
    setLoading(false);
  };

  const refreshUser = async () => {
    if (checkIsLoggedIn()) {
      const remote = await getCurrentUser();
      if (remote.user && remote.user.role !== 'admin') {
        setUser(remote.user);
        await refreshFamilyProfiles();
      }
    }
  };

  const updateProfileState = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveStoredProfile(newProfile);
    if (newProfile.id) {
      setActiveProfileId(newProfile.id);
      setActiveProfileIdState(newProfile.id);
    }
    // Update in familyProfiles list
    setFamilyProfiles(prev => {
      const idx = prev.findIndex(p => (newProfile.id && p.id === newProfile.id) || (p.relationship === newProfile.relationship && p.name === newProfile.name));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newProfile;
        saveStoredProfilesList(next);
        return next;
      }
      const next = [...prev, newProfile];
      saveStoredProfilesList(next);
      return next;
    });
  };

  const isCitizenAuthenticated = Boolean(user && user.role !== "admin");

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        familyProfiles,
        activeProfileId,
        loading,
        isAuthenticated: isCitizenAuthenticated,
        login,
        register,
        logout,
        refreshUser,
        updateProfileState,
        switchActiveProfile,
        refreshFamilyProfiles,
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
