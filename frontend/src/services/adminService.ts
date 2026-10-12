import { AdminUser, AdminDashboardStats, SchemeFormData } from '@/types/admin';
import { Scheme, SchemeStatus } from '@/types/scheme';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api';
const TOKEN_KEY = 'yojana_admin_token';
const USER_KEY = 'yojana_admin_user';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminAuth(token: string, user: AdminUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAdminAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminToken());
}

async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error?: string; status: number }> {
  const token = getAdminToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const status = response.status;
    let json: any = null;

    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (!response.ok) {
      if (status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
        clearAdminAuth();
        window.location.href = '/admin/login?expired=true';
      }
      return {
        data: null,
        error: json?.message || json?.error || `Request failed with status ${status}`,
        status,
      };
    }

    return { data: json as T, status };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'Network error or backend offline.',
      status: 503,
    };
  }
}

export async function adminLogin(
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
  try {
    const url = `${API_BASE_URL}/admin/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password }),
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: json?.message || json?.error || 'Invalid credentials.',
      };
    }

    if (json.token && json.user) {
      setAdminAuth(json.token, json.user);
      return { success: true, user: json.user };
    }

    return { success: false, error: 'Malformed response from authentication server.' };
  } catch (err: any) {
    return {
      success: false,
      error: 'Unable to reach authentication server. Please ensure the backend is running.',
    };
  }
}

export async function adminLogout(): Promise<void> {
  try {
    await adminFetch('/admin/logout', { method: 'POST' });
  } finally {
    clearAdminAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  }
}

export async function getAdminMe(): Promise<AdminUser | null> {
  const res = await adminFetch<AdminUser>('/admin/me');
  return res.data;
}

export async function getAdminDashboard(): Promise<AdminDashboardStats | null> {
  const res = await adminFetch<AdminDashboardStats>('/admin/dashboard');
  return res.data;
}

export async function getAdminSchemes(filters?: {
  q?: string;
  category?: string;
  state?: string;
  status?: string;
}): Promise<Scheme[]> {
  const params = new URLSearchParams();
  if (filters?.q) params.set('q', filters.q);
  if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters?.state && filters.state !== 'all') params.set('state', filters.state);
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await adminFetch<Scheme[]>(`/admin/schemes${queryStr}`);
  return res.data || [];
}

export async function getAdminScheme(schemeId: string): Promise<Scheme | null> {
  const res = await adminFetch<Scheme>(`/admin/schemes/${schemeId}`);
  return res.data;
}

export async function createAdminScheme(
  formData: SchemeFormData
): Promise<{ success: boolean; scheme?: Scheme; error?: string }> {
  const res = await adminFetch<{ message: string; scheme: Scheme }>('/admin/schemes', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  if (res.data?.scheme) {
    return { success: true, scheme: res.data.scheme };
  }
  return { success: false, error: res.error || 'Failed to create scheme.' };
}

export async function updateAdminScheme(
  schemeId: string,
  formData: Partial<SchemeFormData>
): Promise<{ success: boolean; scheme?: Scheme; error?: string }> {
  const res = await adminFetch<{ message: string; scheme: Scheme }>(`/admin/schemes/${schemeId}`, {
    method: 'PUT',
    body: JSON.stringify(formData),
  });

  if (res.data?.scheme) {
    return { success: true, scheme: res.data.scheme };
  }
  return { success: false, error: res.error || 'Failed to update scheme.' };
}

export async function updateAdminSchemeStatus(
  schemeId: string,
  status: SchemeStatus
): Promise<{ success: boolean; scheme?: Scheme; error?: string }> {
  const res = await adminFetch<{ message: string; scheme: Scheme }>(
    `/admin/schemes/${schemeId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );

  if (res.data) {
    return { success: true, scheme: res.data.scheme };
  }
  return { success: false, error: res.error || 'Failed to update status.' };
}

export async function deleteAdminScheme(
  schemeId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await adminFetch<{ message: string }>(`/admin/schemes/${schemeId}`, {
    method: 'DELETE',
  });

  if (res.status === 200) {
    return { success: true };
  }
  return { success: false, error: res.error || 'Failed to delete scheme.' };
}
