import { Scheme, SchemeStatus, ApplicationWindowStatus } from './scheme';

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
  level: string; // "Central Scheme" | "State Scheme" | "District Scheme"
  state: string;
  benefits: string;
  officialUrl: string;
  applicationUrl: string;
  sourceUrl: string;
  applicationProcess: string;
  applicationStatus?: ApplicationWindowStatus;
  ageMin: string | number;
  ageMax: string | number;
  incomeMax: string | number;
  occupation: string;
  education: string;
  gender?: string;
  socialCategory?: string;
  isFarmerOnly?: boolean;
  maxLandholdingAcres?: string | number;
  isStudentOnly?: boolean;
  isBusinessOnly?: boolean;
  isDisabilityRequired?: boolean;
  exclusions?: string[];
  lastVerifiedDate?: string;
  startDate: string;
  endDate: string;
  requiredDocuments: string[];
  status: SchemeStatus;
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority';
  isActive?: boolean;
}
