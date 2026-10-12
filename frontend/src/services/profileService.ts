import { UserProfile } from "@/types/profile";
import { getStoredProfile, saveStoredProfile } from "@/lib/storage";
import { apiFetch } from "@/lib/api";

export async function fetchProfile(): Promise<UserProfile> {
  const backendProfile = await apiFetch<UserProfile>("/profile");
  if (backendProfile) {
    saveStoredProfile(backendProfile);
    return backendProfile;
  }
  return getStoredProfile();
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const current = getStoredProfile();
  const updated: UserProfile = { ...current, ...data };
  saveStoredProfile(updated);

  apiFetch<UserProfile>("/profile", {
    method: "PUT",
    body: JSON.stringify(updated),
  }).catch(() => {});

  return updated;
}
