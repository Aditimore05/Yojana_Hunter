import { ApplicationDraft } from "@/types/application";
import { getStoredDraft, saveStoredDraft } from "@/lib/storage";
import { apiFetch } from "@/lib/api";

export function fetchApplicationDraft(): ApplicationDraft {
  const local = getStoredDraft();
  // Sync with backend database in background
  apiFetch<ApplicationDraft>("/applications/draft").then((backendDraft) => {
    if (backendDraft) {
      saveStoredDraft(backendDraft);
    }
  }).catch(() => {});
  return local;
}

export async function fetchApplicationDraftAsync(): Promise<ApplicationDraft> {
  const backendDraft = await apiFetch<ApplicationDraft>("/applications/draft");
  if (backendDraft) {
    saveStoredDraft(backendDraft);
    return backendDraft;
  }
  return getStoredDraft();
}

export function updateApplicationDraft(data: Partial<ApplicationDraft>): ApplicationDraft {
  const current = getStoredDraft();
  const updated: ApplicationDraft = { ...current, ...data };
  saveStoredDraft(updated);

  apiFetch<ApplicationDraft>("/applications/draft", {
    method: "PUT",
    body: JSON.stringify(updated),
  }).catch(() => {});

  return updated;
}

export async function fetchAllApplications(): Promise<any[]> {
  const backendApps = await apiFetch<any[]>("/applications");
  return backendApps || [];
}

export async function submitApplication(appId?: string): Promise<boolean> {
  const res = await apiFetch<{ message: string }>("/applications/submit", {
    method: "POST",
    body: JSON.stringify({ id: appId }),
  });
  return !!res;
}
