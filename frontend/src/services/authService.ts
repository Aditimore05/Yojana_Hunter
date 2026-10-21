import { 
  User, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  ForgotPasswordResponse 
} from '@/types/auth';
import { UserProfile } from '@/types/profile';
import { apiFetchDetailed, AUTH_TOKEN_KEY, AUTH_USER_KEY, getAuthToken } from '@/lib/api';
import { saveStoredProfile } from '@/lib/storage';

export function setAuth(token: string, user: User, profile?: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  if (profile) {
    saveStoredProfile(profile);
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  const token = getAuthToken();
  const user = getStoredUser();
  if (!token || !user) return false;
  // Preserve role-based access: Admin accounts must not be treated as citizen logins
  if (user.role === 'admin') return false;
  return true;
}

export async function login(
  credentials: LoginCredentials
): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
  const res = await apiFetchDetailed<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (res.data && res.data.token) {
    setAuth(res.data.token, res.data.user, res.data.profile);
    return { success: true, data: res.data };
  }

  return {
    success: false,
    error: res.error || 'Invalid credentials',
  };
}

export async function register(
  data: RegisterData
): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
  const res = await apiFetchDetailed<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (res.data && res.data.token) {
    setAuth(res.data.token, res.data.user, res.data.profile);
    return { success: true, data: res.data };
  }

  return {
    success: false,
    error: res.error || 'Registration failed',
  };
}

export async function logout(): Promise<void> {
  try {
    await apiFetchDetailed('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network errors on logout
  } finally {
    clearAuth();
  }
}

export async function getCurrentUser(): Promise<{
  user: User | null;
  profile: UserProfile | null;
}> {
  if (!isLoggedIn()) {
    return { user: null, profile: null };
  }

  const res = await apiFetchDetailed<{ user: User; profile: UserProfile | null }>('/auth/me');
  if (res.data?.user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.data.user));
    if (res.data.profile) {
      saveStoredProfile(res.data.profile);
    }
    return { user: res.data.user, profile: res.data.profile };
  }

  // If token is invalid or expired
  if (res.status === 401 || res.status === 403) {
    clearAuth();
  }

  return { user: null, profile: null };
}

export async function forgotPassword(
  email: string
): Promise<{ success: boolean; data?: ForgotPasswordResponse; error?: string }> {
  const res = await apiFetchDetailed<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  if (res.data) {
    return { success: true, data: res.data };
  }

  return {
    success: false,
    error: res.error || 'Failed to submit password reset request',
  };
}

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await apiFetchDetailed<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password, confirmPassword }),
  });

  if (res.data) {
    return { success: true, message: res.data.message };
  }

  return {
    success: false,
    error: res.error || 'Failed to reset password',
  };
}
