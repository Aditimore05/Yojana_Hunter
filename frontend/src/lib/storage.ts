import { demoDocuments } from "@/data/demoData";
import { UserProfile } from "@/types/profile";
import { CitizenDocument } from "@/types/document";
import { ApplicationDraft } from "@/types/application";

const KEYS = {
  PROFILE: "yojana_user_profile",
  LANGUAGE: "yojana_user_lang",
  DOCUMENTS: "yojana_user_documents",
  DRAFT: "yojana_user_draft",
  ACTIVE_PROFILE_ID: "yojana_active_profile_id",
  PROFILES_LIST: "yojana_user_profiles_list",
};

export const emptyProfile: UserProfile = {
  relationship: "Self",
  name: "",
  occupation: "",
  age: 0,
  gender: "",
  state: "",
  district: "",
  annualIncome: "",
  education: "",
  category: "",
  fatherName: "",
  dateOfBirth: "",
  completenessPercent: 0,
  language: "en",
  isFarmer: false,
  isStudent: false,
  hasBusiness: false,
  isDisabled: false,
};

export const emptyApplicationDraft: ApplicationDraft = {
  id: "",
  schemeId: "",
  schemeName: "",
  applicantName: "",
  fatherName: "",
  dateOfBirth: "",
  education: "",
  familyIncome: "",
  state: "",
  district: "",
  status: "draft",
  createdAt: "",
};

function getActiveUserId(): number | string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("yojana_auth_user");
    if (raw) {
      const u = JSON.parse(raw);
      return u?.id || null;
    }
  } catch {
    return null;
  }
  return null;
}

export const getStoredProfile = (userId?: number | string): UserProfile => {
  if (typeof window === "undefined") return emptyProfile;
  try {
    const activeId = userId !== undefined ? userId : getActiveUserId();
    const key = activeId ? `${KEYS.PROFILE}_${activeId}` : KEYS.PROFILE;
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure data strictly matches requested or active user
      if (activeId && parsed.userId && String(parsed.userId) !== String(activeId) && String(parsed.user_id) !== String(activeId)) {
        return emptyProfile;
      }
      return parsed;
    }
    return emptyProfile;
  } catch {
    return emptyProfile;
  }
};

export const saveStoredProfile = (profile: UserProfile, userId?: number | string): void => {
  if (typeof window === "undefined") return;
  try {
    const activeId = userId !== undefined ? userId : (profile.userId || profile.user_id || getActiveUserId());
    const key = activeId ? `${KEYS.PROFILE}_${activeId}` : KEYS.PROFILE;
    localStorage.setItem(key, JSON.stringify(profile));
    if (!activeId) {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    } else {
      localStorage.removeItem(KEYS.PROFILE);
    }
  } catch (err) {
    console.error("Failed to save profile to storage", err);
  }
};

export const clearStoredProfile = (userId?: number | string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEYS.PROFILE);
    if (userId) {
      localStorage.removeItem(`${KEYS.PROFILE}_${userId}`);
    } else {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(KEYS.PROFILE)) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (err) {
    console.error("Failed to clear profile from storage", err);
  }
};

export const getActiveProfileId = (): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEYS.ACTIVE_PROFILE_ID);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
};

export const setActiveProfileId = (id: number | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (id !== null && id !== undefined) {
      localStorage.setItem(KEYS.ACTIVE_PROFILE_ID, String(id));
    } else {
      localStorage.removeItem(KEYS.ACTIVE_PROFILE_ID);
    }
  } catch (err) {
    console.error("Failed to set active profile ID", err);
  }
};

export const getStoredProfilesList = (): UserProfile[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.PROFILES_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    return [];
  }
  return [];
};

export const saveStoredProfilesList = (profiles: UserProfile[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.PROFILES_LIST, JSON.stringify(profiles));
  } catch (err) {
    console.error("Failed to save profiles list", err);
  }
};

export const clearAllUserData = (): void => {
  if (typeof window === "undefined") return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith(KEYS.PROFILE) ||
        key.startsWith(KEYS.DOCUMENTS) ||
        key.startsWith(KEYS.DRAFT)
      )) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.error("Failed to clear all user data", err);
  }
};

export const getStoredLanguage = (): "en" | "hi" | "mr" => {
  if (typeof window === "undefined") return "en";
  try {
    return (localStorage.getItem(KEYS.LANGUAGE) as "en" | "hi" | "mr") || "en";
  } catch {
    return "en";
  }
};

export const saveStoredLanguage = (lang: "en" | "hi" | "mr"): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.LANGUAGE, lang);
  } catch (err) {
    console.error("Failed to save language to storage", err);
  }
};

export const getStoredDocuments = (): CitizenDocument[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveStoredDocuments = (docs: CitizenDocument[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (err) {
    console.error("Failed to save documents to storage", err);
  }
};

export const getStoredDraft = (): ApplicationDraft => {
  if (typeof window === "undefined") return emptyApplicationDraft;
  try {
    const data = localStorage.getItem(KEYS.DRAFT);
    return data ? JSON.parse(data) : emptyApplicationDraft;
  } catch {
    return emptyApplicationDraft;
  }
};

export const saveStoredDraft = (draft: ApplicationDraft): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.DRAFT, JSON.stringify(draft));
  } catch (err) {
    console.error("Failed to save draft to storage", err);
  }
};

export const clearStoredDraft = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEYS.DRAFT);
  } catch (err) {
    console.error("Failed to clear draft from storage", err);
  }
};
