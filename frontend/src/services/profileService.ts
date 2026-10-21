import { UserProfile } from "@/types/profile";
import { getStoredProfile, saveStoredProfile } from "@/lib/storage";
import { apiFetch } from "@/lib/api";

export async function fetchProfile(): Promise<UserProfile> {
  try {
    const backendProfile = await apiFetch<UserProfile>("/profile");
    if (backendProfile) {
      saveStoredProfile(backendProfile);
      return backendProfile;
    }
  } catch (err) {
    console.warn("fetchProfile network error, falling back to local storage:", err);
  }
  return getStoredProfile();
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const current = getStoredProfile();
  const updated: UserProfile = { ...current, ...data };
  
  // Calculate completeness if possible
  const keyFields = [
    updated.name, updated.age, updated.gender, updated.occupation, updated.annualIncome,
    updated.state, updated.district, updated.education, updated.category
  ];
  const filled = keyFields.filter(f => f !== undefined && f !== null && String(f).trim() !== "").length;
  updated.completenessPercent = Math.round((filled / keyFields.length) * 100);

  saveStoredProfile(updated);

  try {
    const res = await apiFetch<UserProfile>("/profile", {
      method: "PUT",
      body: JSON.stringify(updated),
    });
    if (res) {
      saveStoredProfile(res);
      return res;
    }
  } catch (err) {
    console.warn("updateProfile network error, saved locally:", err);
  }

  return updated;
}
