export type SubscriptionPlanId = "monthly" | "two_months" | "yearly";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  duration_label: string;
  popular?: boolean;
  badge?: string;
  description: string;
  features: string[];
}

export interface PlanComparisonRow {
  feature: string;
  free: string;
  premium: string;
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
  comparison: PlanComparisonRow[];
  free_limit: number;
}

export type SubscriptionStatus = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "cancelled"
  | "Pending" 
  | "Approved" 
  | "Rejected" 
  | "Cancelled";

export interface SubscriptionRequestRecord {
  id: number;
  userId: number;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  durationDays: number;
  status: SubscriptionStatus;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  reviewedByAdminId?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  user?: {
    id: number;
    email?: string;
    mobile?: string;
    name: string;
  };
  userName?: string;
  userEmail?: string;
}

export interface UserSubscriptionStatus {
  is_premium: boolean;
  tier: "free" | "premium";
  free_limit: number;
  active_subscription?: SubscriptionRequestRecord | null;
  days_remaining?: number | null;
  pending_request?: SubscriptionRequestRecord | null;
  latest_request?: SubscriptionRequestRecord | null;
}

export interface SubscriptionAdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AdminSubscriptionListResponse {
  requests: SubscriptionRequestRecord[];
  stats: SubscriptionAdminStats;
}
