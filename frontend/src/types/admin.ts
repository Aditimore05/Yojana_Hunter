import { Scheme, SchemeStatus } from './scheme';

export interface AdminUser {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
  mobile?: string;
  createdAt?: string;
}

export interface AdminDashboardStats {
  totalSchemes: number;
  publishedSchemes: number;
  draftSchemes: number;
  archivedSchemes: number;
  recentSchemes: Scheme[];
  systemStatus?: string;
  database?: string;
}

export interface SchemeFormData {
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  department: string;
  level: string;
  state: string;
  benefits: string;
  officialUrl: string;
  applicationUrl: string;
  sourceUrl: string;
  applicationProcess: string;
  ageMin: string | number;
  ageMax: string | number;
  incomeMax: string | number;
  occupation: string;
  education: string;
  startDate: string;
  endDate: string;
  requiredDocuments: string[];
  status: SchemeStatus;
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority';
}
