import { Scheme } from '@/types/scheme';
import { apiFetchDetailed } from '@/lib/api';

export async function getSavedSchemes(): Promise<Scheme[]> {
  const res = await apiFetchDetailed<{ total_saved: number; schemes: Scheme[] }>('/saved-schemes');
  if (res.data?.schemes) {
    return res.data.schemes;
  }
  return [];
}

export async function saveScheme(schemeId: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiFetchDetailed<{ saved: boolean; message?: string }>('/saved-schemes', {
    method: 'POST',
    body: JSON.stringify({ schemeId }),
  });

  return {
    success: Boolean(res.data?.saved),
    message: res.data?.message || res.error,
  };
}

export async function removeSavedScheme(schemeId: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiFetchDetailed<{ saved: boolean; message?: string }>(`/saved-schemes/${schemeId}`, {
    method: 'DELETE',
  });

  return {
    success: res.status === 200,
    message: res.data?.message || res.error,
  };
}

export async function checkIsSaved(schemeId: string): Promise<boolean> {
  const res = await apiFetchDetailed<{ isSaved: boolean }>(`/saved-schemes/check/${schemeId}`);
  return Boolean(res.data?.isSaved);
}
