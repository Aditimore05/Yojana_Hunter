import { UserProfile, UserActivity, UserLevelInfo } from "@/types/profile";
import { 
  getStoredProfile, 
  saveStoredProfile, 
  getActiveProfileId, 
  setActiveProfileId, 
  getStoredProfilesList, 
  saveStoredProfilesList 
} from "@/lib/storage";
import { apiFetch } from "@/lib/api";

export { getActiveProfileId, setActiveProfileId };

export async function fetchProfiles(): Promise<UserProfile[]> {
  try {
    const res = await apiFetch<{ profiles: UserProfile[]; count: number }>("/profiles/all");
    if (res && Array.isArray(res.profiles)) {
      saveStoredProfilesList(res.profiles);
      return res.profiles;
    }
  } catch (err) {
    console.warn("fetchProfiles network error, falling back to local storage:", err);
  }
  return getStoredProfilesList();
}

export async function fetchProfile(profileId?: number): Promise<UserProfile> {
  const activeId = profileId || getActiveProfileId();
  const queryStr = activeId ? `?profile_id=${activeId}` : "";
  try {
    const backendProfile = await apiFetch<UserProfile>(`/profile${queryStr}`);
    if (backendProfile) {
      saveStoredProfile(backendProfile);
      return backendProfile;
    }
  } catch (err) {
    console.warn("fetchProfile network error, falling back to local storage:", err);
  }
  return getStoredProfile();
}

export async function createProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const payload = {
    relationship: data.relationship || "Other",
    name: data.name || data.fullName || "Family Member",
    ...data,
  };

  try {
    const res = await apiFetch<UserProfile>("/profiles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res) {
      if (res.id) {
        setActiveProfileId(res.id);
      }
      saveStoredProfile(res);
      // Refresh stored list
      fetchProfiles().catch(() => {});
      return res;
    }
  } catch (err) {
    console.warn("createProfile network error:", err);
  }

  // Fallback local creation
  const localId = Date.now();
  const fallback: UserProfile = {
    id: localId,
    name: payload.name,
    relationship: payload.relationship,
    occupation: payload.occupation || "",
    age: payload.age || 0,
    state: payload.state || "",
    district: payload.district || "",
    annualIncome: payload.annualIncome || "",
    education: payload.education || "",
    category: payload.category || "General",
    completenessPercent: 70,
    language: "en",
    ...payload,
  };
  saveStoredProfile(fallback);
  setActiveProfileId(localId);
  return fallback;
}

export async function updateProfile(data: Partial<UserProfile>, profileId?: number): Promise<UserProfile> {
  const targetId = profileId || data.id || getActiveProfileId();
  const current = getStoredProfile();
  const updated: UserProfile = { ...current, ...data };
  if (targetId) updated.id = targetId;

  // Calculate completeness
  const keyFields = [
    updated.name, updated.age, updated.gender, updated.occupation, updated.annualIncome,
    updated.state, updated.district, updated.education, updated.category
  ];
  const filled = keyFields.filter(f => f !== undefined && f !== null && String(f).trim() !== "").length;
  updated.completenessPercent = Math.round((filled / keyFields.length) * 100);

  saveStoredProfile(updated);

  try {
    const endpoint = targetId ? `/profiles/${targetId}` : "/profile";
    const res = await apiFetch<UserProfile>(endpoint, {
      method: "PUT",
      body: JSON.stringify(updated),
    });
    if (res) {
      saveStoredProfile(res);
      fetchProfiles().catch(() => {});
      return res;
    }
  } catch (err) {
    console.warn("updateProfile network error, saved locally:", err);
  }

  return updated;
}

export async function deleteProfile(profileId: number): Promise<boolean> {
  try {
    await apiFetch<{ success: boolean }>(`/profiles/${profileId}`, {
      method: "DELETE",
    });
    const currentActive = getActiveProfileId();
    if (currentActive === profileId) {
      setActiveProfileId(null);
    }
    await fetchProfiles();
    return true;
  } catch (err) {
    console.error("deleteProfile failed:", err);
    return false;
  }
}

export async function fetchUserActivities(): Promise<UserActivity[]> {
  try {
    const res = await apiFetch<{ activities: UserActivity[]; count: number }>("/profile/activities");
    if (res && Array.isArray(res.activities)) {
      return res.activities;
    }
  } catch (err) {
    console.warn("fetchUserActivities network error:", err);
  }
  return [];
}

export async function fetchUserLevel(profileId?: number): Promise<UserLevelInfo | null> {
  try {
    const q = profileId ? `?profile_id=${profileId}` : "";
    const res = await apiFetch<UserLevelInfo>(`/profile/level${q}`);
    if (res && res.level) {
      return res;
    }
  } catch (err) {
    console.warn("fetchUserLevel network error:", err);
  }
  return null;
}
