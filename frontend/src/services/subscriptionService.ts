import { apiFetch } from "@/lib/api";
import { 
  SubscriptionPlansResponse, 
  UserSubscriptionStatus, 
  SubscriptionRequestRecord, 
  AdminSubscriptionListResponse 
} from "@/types/subscription";
import { getAdminToken, clearAdminAuth } from "@/services/adminService";

const API_BASE_URL = typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api');

/**
 * Fetch available subscription plans and comparison matrix (Public/Citizen)
 */
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
  try {
    const data = await apiFetch<SubscriptionPlansResponse>("/subscriptions/plans");
    if (data && data.plans) return data;
    throw new Error("Invalid plans data received");
  } catch (error) {
    console.warn("Failed to fetch subscription plans, using fallback configuration:", error);
    return {
      plans: [
        {
          id: "monthly",
          name: "Monthly Access",
          price: 50,
          currency: "INR",
          duration_days: 30,
          duration_label: "1 Month",
          popular: false,
          badge: "Flexible",
          description: "Ideal for immediate scheme applications and fast verification.",
          features: [
            "Full access to all matching government schemes (unlimited)",
            "Instant AI eligibility evaluation & detailed criteria breakdown",
            "Direct application portal links & procedure guidance",
            "Complete document checklists for every scheme",
            "Priority scheme update notifications",
            "30 days uninterrupted validity"
          ]
        },
        {
          id: "two_months",
          name: "2 Months Standard",
          price: 100,
          currency: "INR",
          duration_days: 60,
          duration_label: "2 Months",
          popular: false,
          badge: "Standard",
          description: "Perfect for seasonal schemes and continuous tracking across cycles.",
          features: [
            "Full access to all matching government schemes (unlimited)",
            "Instant AI eligibility evaluation & detailed criteria breakdown",
            "Direct application portal links & procedure guidance",
            "Complete document checklists for every scheme",
            "Multi-scheme tracking & application reminders",
            "60 days uninterrupted validity"
          ]
        },
        {
          id: "yearly",
          name: "Yearly Premium Pass",
          price: 500,
          currency: "INR",
          duration_days: 365,
          duration_label: "12 Months (1 Year)",
          popular: true,
          badge: "Best Value (Save ₹100)",
          description: "Complete year-round coverage for your entire family across Central and State schemes.",
          features: [
            "Full access to all matching government schemes (unlimited)",
            "Instant AI eligibility evaluation & detailed criteria breakdown",
            "Direct application portal links & procedure guidance",
            "Complete document checklists for every scheme",
            "Priority AI scheme discovery alerts for newly launched schemes",
            "Dedicated family benefit tracking",
            "365 days uninterrupted full access"
          ]
        }
      ],
      comparison: [
        { feature: "View Matching Scheme Count", free: "Yes (Total count shown)", premium: "Yes (Total count shown)" },
        { feature: "Accessible Scheme Details", free: "First 5 matching schemes", premium: "All matching schemes (Unlimited)" },
        { feature: "Official Application Portal Links", free: "First 5 schemes only", premium: "All verified government schemes" },
        { feature: "Required Document Checklists", free: "First 5 schemes only", premium: "Full checklists for all schemes" },
        { feature: "Detailed Eligibility Explanations", free: "First 5 schemes only", premium: "Instant AI explanations on every scheme" },
        { feature: "Application Tracking & Drafts", free: "Limited", premium: "Unlimited draft and application tracking" },
        { feature: "New Scheme Launch Alerts", free: "Standard", premium: "Priority automated alerts" }
      ],
      free_limit: 5
    };
  }
}

/**
 * Fetch current user's subscription tier and active subscription status
 */
export async function fetchMySubscriptionStatus(): Promise<UserSubscriptionStatus> {
  try {
    const data = await apiFetch<UserSubscriptionStatus>("/subscriptions/my-status");
    if (data) return data;
  } catch (error) {
    console.warn("Could not fetch my subscription status:", error);
  }
  return {
    is_premium: false,
    tier: "free",
    free_limit: 5,
    active_subscription: null,
    pending_request: null,
    latest_request: null
  };
}

/**
 * Submit a demo subscription request (awaiting manual admin approval)
 */
export async function submitSubscriptionRequest(
  planId: string, 
  adminNotes?: string
): Promise<{ success: boolean; message: string; request?: SubscriptionRequestRecord }> {
  try {
    const data = await apiFetch<{ message: string; request: SubscriptionRequestRecord }>("/subscriptions/request", {
      method: "POST",
      body: JSON.stringify({ planId, adminNotes })
    });
    return {
      success: true,
      message: data.message || "Your subscription request has been submitted and is awaiting admin approval.",
      request: data.request
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to submit subscription request."
    };
  }
}

/**
 * Cancel a pending subscription request
 */
export async function cancelSubscriptionRequest(
  requestId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const data = await apiFetch<{ message: string }>("/subscriptions/cancel", {
      method: "POST",
      body: JSON.stringify({ requestId })
    });
    return {
      success: true,
      message: data.message || "Subscription request cancelled."
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to cancel subscription request."
    };
  }
}

// ==========================================
// ADMIN SUBSCRIPTION MANAGEMENT METHODS
// ==========================================

async function adminApiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data: T | null; error?: string }> {
  const token = getAdminToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, { ...options, headers });
    let json: any = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        clearAdminAuth();
        window.location.href = "/admin/login?expired=true";
      }
      return { data: null, error: json?.message || json?.error || `HTTP ${response.status}` };
    }

    return { data: json as T };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error" };
  }
}

/**
 * Fetch all subscription requests for Admin management
 */
export async function fetchAdminSubscriptions(
  statusFilter?: string, 
  searchQuery?: string
): Promise<AdminSubscriptionListResponse | null> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
  if (searchQuery && searchQuery.trim()) params.set("q", searchQuery.trim());

  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await adminApiCall<AdminSubscriptionListResponse>(`/admin/subscriptions${qs}`);
  return res.data;
}

/**
 * Approve a subscription request (Admin only)
 */
export async function approveSubscription(
  requestId: number
): Promise<{ success: boolean; message: string; subscription?: SubscriptionRequestRecord }> {
  const res = await adminApiCall<{ message: string; subscription: SubscriptionRequestRecord }>(
    `/admin/subscriptions/${requestId}/approve`,
    { method: "POST" }
  );

  if (res.data) {
    return { success: true, message: res.data.message, subscription: res.data.subscription };
  }
  return { success: false, message: res.error || "Failed to approve subscription" };
}

/**
 * Reject a subscription request (Admin only)
 */
export async function rejectSubscription(
  requestId: number, 
  reason?: string
): Promise<{ success: boolean; message: string; subscription?: SubscriptionRequestRecord }> {
  const res = await adminApiCall<{ message: string; subscription: SubscriptionRequestRecord }>(
    `/admin/subscriptions/${requestId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason })
    }
  );

  if (res.data) {
    return { success: true, message: res.data.message, subscription: res.data.subscription };
  }
  return { success: false, message: res.error || "Failed to reject subscription" };
}

// Convenient aliases
export const fetchAdminSubscriptionRequests = fetchAdminSubscriptions;
export const approveSubscriptionRequest = approveSubscription;
export const rejectSubscriptionRequest = rejectSubscription;
