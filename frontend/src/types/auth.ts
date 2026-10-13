import { UserProfile } from './profile';

export interface User {
  id: number;
  email: string;
  mobile?: string | null;
  role: 'citizen' | 'admin' | 'helper' | 'curator';
  isActive: boolean;
  createdAt?: string | null;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
  profile?: UserProfile;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  profileData?: Partial<UserProfile>;
}

export interface ForgotPasswordResponse {
  message: string;
  status_code: number;
  dev_notice?: string;
  dev_reset_token?: string;
  dev_reset_link?: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword?: string;
}
