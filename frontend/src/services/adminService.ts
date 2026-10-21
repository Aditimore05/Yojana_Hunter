import { 
  AdminUser, 
  AdminDashboardStats, 
  SchemeFormData, 
  DiscoveryJob, 
  SchemeReviewHistory, 
  GeminiStatus,
  DiscoverySchedule
} from '@/types/admin';
import { Scheme, SchemeStatus } from '@/types/scheme';

const API_BASE_URL = typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api');
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
  department?: string;
  level?: string;
  status?: string;
  applicationStatus?: string;
}): Promise<Scheme[]> {
  const params = new URLSearchParams();
  if (filters?.q) params.set('q', filters.q);
  if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters?.state && filters.state !== 'all') params.set('state', filters.state);
  if (filters?.department && filters.department !== 'all') params.set('department', filters.department);
  if (filters?.level && filters.level !== 'all') params.set('level', filters.level);
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters?.applicationStatus && filters.applicationStatus !== 'all') params.set('application_status', filters.applicationStatus);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await adminFetch<Scheme[]>(`/admin/schemes${queryStr}`);
  return res.data || [];
}

export async function toggleAdminSchemeActive(
  schemeId: string,
  isActive?: boolean
): Promise<{ success: boolean; scheme?: Scheme; isActive?: boolean; error?: string }> {
  const res = await adminFetch<{ message: string; isActive: boolean; scheme: Scheme }>(
    `/admin/schemes/${schemeId}/toggle-active`,
    {
      method: 'PATCH',
      body: JSON.stringify(isActive !== undefined ? { isActive } : {}),
    }
  );

  if (res.data) {
    return { success: true, scheme: res.data.scheme, isActive: res.data.isActive };
  }
  return { success: false, error: res.error || 'Failed to toggle active status.' };
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

// ==========================================
// GEMINI DISCOVERY & SCHEME REVIEW APIS
// ==========================================

export async function getGeminiStatus(): Promise<GeminiStatus | null> {
  const res = await adminFetch<GeminiStatus>('/admin/gemini/status');
  return res.data;
}

export async function startDiscoveryJob(params?: {
  state?: string;
  category?: string;
  department?: string;
  query?: string;
  maxQueries?: number;
}): Promise<{ success: boolean; jobId?: string; message?: string; error?: string }> {
  const res = await adminFetch<{ success: boolean; jobId: string; message: string }>(
    '/admin/discovery-jobs',
    {
      method: 'POST',
      body: JSON.stringify(params || {}),
    }
  );
  if (res.data?.success) {
    return { success: true, jobId: res.data.jobId, message: res.data.message };
  }
  return { success: false, error: res.error || 'Failed to start discovery job.' };
}

export async function getDiscoveryJobs(
  limit: number = 20,
  offset: number = 0,
  status?: string
): Promise<{ total: number; activeJobId?: string | null; jobs: DiscoveryJob[] }> {
  const params = new URLSearchParams();
  params.set('limit', limit.toString());
  params.set('offset', offset.toString());
  if (status && status !== 'all') params.set('status', status);

  const res = await adminFetch<{ total: number; activeJobId: string | null; jobs: DiscoveryJob[] }>(
    `/admin/discovery-jobs?${params.toString()}`
  );
  return res.data || { total: 0, activeJobId: null, jobs: [] };
}

export async function getDiscoveryJob(jobId: string): Promise<DiscoveryJob | null> {
  const res = await adminFetch<DiscoveryJob>(`/admin/discovery-jobs/${jobId}`);
  return res.data;
}

export async function cancelDiscoveryJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const res = await adminFetch<{ success: boolean; message?: string }>(
    `/admin/discovery-jobs/${jobId}/cancel`,
    { method: 'POST' }
  );
  return { success: !!res.data?.success, error: res.error };
}

export async function getPendingReviewSchemes(
  reviewStatus: string = 'pending_review',
  limit: number = 50
): Promise<Scheme[]> {
  const res = await adminFetch<{ count: number; schemes: Scheme[] }>(
    `/admin/schemes/pending-review?reviewStatus=${reviewStatus}&limit=${limit}`
  );
  return res.data?.schemes || [];
}

export async function approveAdminScheme(
  schemeId: string,
  notes?: string
): Promise<{ success: boolean; scheme?: Scheme; error?: string }> {
  const res = await adminFetch<{ message: string; scheme: Scheme }>(
    `/admin/schemes/${schemeId}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }
  );
  if (res.data?.scheme) {
    return { success: true, scheme: res.data.scheme };
  }
  return { success: false, error: res.error || 'Failed to approve scheme.' };
}

export async function rejectAdminScheme(
  schemeId: string,
  reason: string
): Promise<{ success: boolean; scheme?: Scheme; error?: string }> {
  const res = await adminFetch<{ message: string; scheme: Scheme }>(
    `/admin/schemes/${schemeId}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }
  );
  if (res.data?.scheme) {
    return { success: true, scheme: res.data.scheme };
  }
  return { success: false, error: res.error || 'Failed to reject scheme.' };
}

export async function reverifyAdminScheme(
  schemeId: string,
  notes?: string
): Promise<{ success: boolean; scheme?: Scheme; error?: string }> {
  const res = await adminFetch<{ message: string; scheme: Scheme }>(
    `/admin/schemes/${schemeId}/reverify`,
    {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }
  );
  if (res.data?.scheme) {
    return { success: true, scheme: res.data.scheme };
  }
  return { success: false, error: res.error || 'Failed to request re-verification.' };
}

export async function getAdminSchemeHistory(
  schemeId: string
): Promise<{ reviewHistory: SchemeReviewHistory[]; changeLogs: Array<{ id: number; summary: string; detectedAt: string }> } | null> {
  const res = await adminFetch<{
    reviewHistory: SchemeReviewHistory[];
    changeLogs: Array<{ id: number; summary: string; detectedAt: string }>;
  }>(`/admin/schemes/${schemeId}/history`);
  return res.data;
}

export async function testGeminiConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  model?: string;
  groundingSupported?: boolean;
  groundingStatus?: string;
  latencyMs?: number;
}> {
  const res = await adminFetch<{ 
    success: boolean; 
    message: string; 
    model?: string;
    groundingSupported?: boolean;
    groundingStatus?: string;
    latencyMs?: number;
  }>(
    '/admin/gemini/test',
    { method: 'POST' }
  );
  return res.data || { success: false, message: res.error || 'Connection test failed.' };
}

export async function getDiscoverySchedule(): Promise<DiscoverySchedule | null> {
  const res = await adminFetch<DiscoverySchedule>('/admin/discovery/schedule');
  return res.data;
}

export async function updateDiscoverySchedule(
  schedule: Partial<DiscoverySchedule>
): Promise<{ success: boolean; schedule?: DiscoverySchedule; error?: string }> {
  const res = await adminFetch<{ message: string; schedule: DiscoverySchedule }>(
    '/admin/discovery/schedule',
    {
      method: 'POST',
      body: JSON.stringify(schedule),
    }
  );
  if (res.data?.schedule) {
    return { success: true, schedule: res.data.schedule };
  }
  return { success: false, error: res.error || 'Failed to update schedule.' };
}

export async function triggerScheduledDiscoveryNow(): Promise<{ success: boolean; jobId?: string; message?: string; error?: string }> {
  const res = await adminFetch<{ success: boolean; jobId: string; message: string }>(
    '/admin/discovery/schedule/run-now',
    { method: 'POST' }
  );
  if (res.data?.success) {
    return { success: true, jobId: res.data.jobId, message: res.data.message };
  }
  return { success: false, error: res.error || 'Failed to trigger scheduled run.' };
}

