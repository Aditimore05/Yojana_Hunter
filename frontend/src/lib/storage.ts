import { initialProfile, demoDocuments, demoApplicationDraft } from "@/data/demoData";
import { UserProfile } from "@/types/profile";
import { CitizenDocument } from "@/types/document";
import { ApplicationDraft } from "@/types/application";

const KEYS = {
  PROFILE: "yojana_user_profile",
  LANGUAGE: "yojana_user_lang",
  DOCUMENTS: "yojana_user_documents",
  DRAFT: "yojana_user_draft",
};

export const getStoredProfile = (): UserProfile => {
  if (typeof window === "undefined") return initialProfile;
  try {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : initialProfile;
  } catch {
    return initialProfile;
  }
};

export const saveStoredProfile = (profile: UserProfile): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save profile to storage", err);
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
  if (typeof window === "undefined") return demoDocuments;
  try {
    const data = localStorage.getItem(KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : demoDocuments;
  } catch {
    return demoDocuments;
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
  if (typeof window === "undefined") return demoApplicationDraft;
  try {
    const data = localStorage.getItem(KEYS.DRAFT);
    return data ? JSON.parse(data) : demoApplicationDraft;
  } catch {
    return demoApplicationDraft;
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
