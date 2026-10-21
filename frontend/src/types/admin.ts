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

export interface DiscoveryJob {
  id: number;
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled';
  queryCount: number;
  categoryCount: number;
  discoveredCount: number;
  createdCount: number;
  updatedCount: number;
  duplicateCount: number;
  skippedCount: number;
  rejectedCount: number;
  failedCount: number;
  parameters: Record<string, any>;
  errorSummary?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  logs?: DiscoveryJobLog[];
  discoveredSchemes?: Array<{
    id: number;
    slug: string;
    name: string;
    category: string;
    state: string;
    adminReviewStatus: string;
    applicationStatus: string;
  }>;
}

export interface DiscoveryJobLog {
  id: number;
  jobId: number;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SchemeCitation {
  id: number;
  schemeId: number;
  sourceTitle: string;
  sourceUrl: string;
  excerpt: string;
  confidenceScore: number;
  verifiedAt: string;
}

export interface SchemeReviewHistory {
  id: number;
  schemeId: number;
  adminId?: number;
  adminEmail?: string;
  action: 'approve' | 'reject' | 'reverify' | 'edit';
  reason?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  timestamp: string;
}

export interface GeminiStatus {
  configured: boolean;
  connected: boolean;
  model: string;
  groundingSupported: boolean;
  groundingChunksCount?: number;
  groundingStatus?: string;
  latencyMs?: number;
  message: string;
  quotaExhausted: boolean;
}

export interface DiscoverySchedule {
  id: number;
  isEnabled: boolean;
  frequencyHours: number;
  parameters: {
    state?: string;
    category?: string;
    department?: string;
    query?: string;
    max_queries?: number;
  };
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastJobId: string | null;
  lastStatus: string | null;
  updatedAt: string | null;
  isJobRunning?: boolean;
  activeJobId?: string | null;
}

