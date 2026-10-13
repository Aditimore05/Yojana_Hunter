import { demoSchemes } from "@/data/demoData";
import { Scheme, EligibilityStatus } from "@/types/scheme";
import { apiFetch } from "@/lib/api";

export async function getSchemes(
  filter?: EligibilityStatus | "all", 
  query?: string,
  category?: string,
  state?: string
): Promise<Scheme[]> {
  try {
    const params = new URLSearchParams();
    if (filter && filter !== "all") params.set("filter", filter);
    if (query && query.trim() !== "") params.set("q", query.trim());
    if (category && category !== "all") params.set("category", category);
    if (state && state !== "all") params.set("state", state);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const backendData = await apiFetch<Scheme[]>(`/schemes${queryStr}`);
    const all = Array.isArray(backendData) ? backendData : demoSchemes;

    let result = [...all];

    if (filter && filter !== "all") {
      result = result.filter((s) => s.eligibilityStatus === filter || (s as any).legacyEligibilityStatus === filter);
    }

    if (query && query.trim() !== "") {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.shortDescription.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.benefits && s.benefits.toLowerCase().includes(q))
      );
    }

    return result;
  } catch {
    return demoSchemes;
  }
}

export async function getSchemeById(id: string): Promise<Scheme | undefined> {
  try {
    const backendData = await apiFetch<Scheme>(`/schemes/${id}`);
    if (backendData) return backendData;
    return demoSchemes.find((s) => s.id === id || s.slug === id);
  } catch {
    return demoSchemes.find((s) => s.id === id || s.slug === id);
  }
}

export async function matchSchemesWithProfile(
  profilePayload: Record<string, any>
): Promise<{
  total_evaluated: number;
  eligible_count: number;
  possibly_eligible_count: number;
  not_eligible_count: number;
  applications_closed_count: number;
  schemes: Scheme[];
}> {
  try {
    const res = await apiFetch<any>("/schemes/match", {
      method: "POST",
      body: JSON.stringify(profilePayload),
    });
    if (res && Array.isArray(res.schemes)) {
      return res;
    }
    return {
      total_evaluated: 0,
      eligible_count: 0,
      possibly_eligible_count: 0,
      not_eligible_count: 0,
      applications_closed_count: 0,
      schemes: [],
    };
  } catch {
    return {
      total_evaluated: 0,
      eligible_count: 0,
      possibly_eligible_count: 0,
      not_eligible_count: 0,
      applications_closed_count: 0,
      schemes: [],
    };
  }
}

export interface SyncResponse {
  success: boolean;
  schemes_attempted: number;
  schemes_fetched: number;
  schemes_verified: number;
  schemes_inserted: number;
  schemes_updated: number;
  schemes_skipped_or_failed: number;
  demo_profile_matches?: {
    eligible_count: number;
    possibly_eligible_count: number;
    not_eligible_count: number;
    applications_closed_count: number;
    total_evaluated: number;
  };
  last_sync_time?: string;
  last_sync_display?: string;
  source_statuses?: Array<{
    slug: string;
    name: string;
    url: string;
    status: string;
    latency_ms: number;
    application_url?: string;
  }>;
  failures?: any[];
  error?: string;
}

export async function syncSchemes(profilePayload?: Record<string, any>): Promise<SyncResponse> {
  try {
    const res = await apiFetch<SyncResponse>("/schemes/sync", {
      method: "POST",
      body: JSON.stringify({ profile: profilePayload }),
    });
    return res || {
      success: false,
      schemes_attempted: 10,
      schemes_fetched: 0,
      schemes_verified: 0,
      schemes_inserted: 0,
      schemes_updated: 0,
      schemes_skipped_or_failed: 10,
      error: "No response from synchronization backend",
    };
  } catch (err: any) {
    return {
      success: false,
      schemes_attempted: 10,
      schemes_fetched: 0,
      schemes_verified: 0,
      schemes_inserted: 0,
      schemes_updated: 0,
      schemes_skipped_or_failed: 10,
      error: err?.message || "Failed to trigger scheme synchronization",
    };
  }
}

export async function getSyncStatus(): Promise<{
  total_schemes: number;
  verified_schemes: number;
  last_sync_time: string | null;
  last_verified_date: string;
  status: string;
}> {
  try {
    const res = await apiFetch<any>("/schemes/sync-status");
    if (res) return res;
    return {
      total_schemes: 10,
      verified_schemes: 10,
      last_sync_time: null,
      last_verified_date: "13 Oct 2026",
      status: "ready",
    };
  } catch {
    return {
      total_schemes: 10,
      verified_schemes: 10,
      last_sync_time: null,
      last_verified_date: "13 Oct 2026",
      status: "ready",
    };
  }
}

export async function getRecommendations(params?: {
  limit?: number;
  state?: string;
  occupation?: string;
}): Promise<{
  profile_evaluated: Record<string, any>;
  total_evaluated: number;
  recommendations_count: number;
  recommendations: Scheme[];
}> {
  try {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.state) query.set("state", params.state);
    if (params?.occupation) query.set("occupation", params.occupation);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiFetch<any>(`/schemes/recommendations${qs}`);
    if (res && Array.isArray(res.recommendations)) return res;
    return {
      profile_evaluated: {},
      total_evaluated: 0,
      recommendations_count: 0,
      recommendations: [],
    };
  } catch {
    return {
      profile_evaluated: {},
      total_evaluated: 0,
      recommendations_count: 0,
      recommendations: [],
    };
  }
}

