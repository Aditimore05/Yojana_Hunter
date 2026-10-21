"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Play, 
  Globe, 
  ExternalLink, 
  Check, 
  X, 
  RotateCw, 
  FileText, 
  ShieldCheck, 
  Layers, 
  Filter, 
  ChevronRight,
  Info,
  Calendar,
  AlertCircle,
  Timer,
  Zap,
  CheckCheck
} from "lucide-react";
import { 
  getGeminiStatus, 
  testGeminiConnection, 
  startDiscoveryJob, 
  getDiscoveryJobs, 
  getDiscoveryJob, 
  getPendingReviewSchemes, 
  approveAdminScheme, 
  rejectAdminScheme, 
  reverifyAdminScheme,
  getDiscoverySchedule,
  updateDiscoverySchedule,
  triggerScheduledDiscoveryNow
} from "@/services/adminService";
import { 
  DiscoveryJob, 
  GeminiStatus, 
  SchemeCitation,
  DiscoverySchedule
} from "@/types/admin";
import { Scheme } from "@/types/scheme";

export default function AdminDiscoveryPage() {
  // Gemini Status
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ 
    success: boolean; 
    message: string; 
    model?: string;
    groundingSupported?: boolean;
    groundingStatus?: string;
    latencyMs?: number;
  } | null>(null);

  // Scheduled Discovery State
  const [schedule, setSchedule] = useState<DiscoverySchedule | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState(24);
  const [triggeringScheduledRun, setTriggeringScheduledRun] = useState(false);

  // Discovery Job Form & State
  const [startingJob, setStartingJob] = useState(false);
  const [stateFilter, setStateFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentInput, setDepartmentInput] = useState("");
  const [customQueryInput, setCustomQueryInput] = useState("");
  const [maxQueriesInput, setMaxQueriesInput] = useState(4);
  const [jobNotice, setJobNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Jobs List & Details
  const [jobs, setJobs] = useState<DiscoveryJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<DiscoveryJob | null>(null);
  const [viewingLogs, setViewingLogs] = useState(false);

  // Pending Schemes Review Queue
  const [pendingSchemes, setPendingSchemes] = useState<Scheme[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [selectedSchemeForReview, setSelectedSchemeForReview] = useState<Scheme | null>(null);
  
  // Rejection modal
  const [rejectingSchemeId, setRejectingSchemeId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch Gemini Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await getGeminiStatus();
      setGeminiStatus(res);
    } catch (err) {
      console.error("Failed to load Gemini status", err);
    }
  }, []);

  // Run Connection Test
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testGeminiConnection();
      setTestResult(res);
      await fetchStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Failed to execute connection test.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Fetch Schedule
  const fetchSchedule = useCallback(async () => {
    setLoadingSchedule(true);
    try {
      const s = await getDiscoverySchedule();
      if (s) {
        setSchedule(s);
        setScheduleEnabled(s.isEnabled);
        setScheduleFrequency(s.frequencyHours || 24);
      }
    } catch (err) {
      console.error("Failed to load schedule", err);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  // Save Schedule Settings
  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    setScheduleNotice(null);
    try {
      const res = await updateDiscoverySchedule({
        isEnabled: scheduleEnabled,
        frequencyHours: Number(scheduleFrequency),
        parameters: {
          state: stateFilter === "all" ? "All India" : stateFilter,
          category: categoryFilter === "all" ? "All" : categoryFilter,
          department: departmentInput.trim() || undefined,
          query: customQueryInput.trim() || undefined,
          max_queries: Number(maxQueriesInput) || 4,
        }
      });
      if (res.success && res.schedule) {
        setSchedule(res.schedule);
        setScheduleNotice({
          type: "success",
          message: `Schedule saved. Automatic background discovery is ${res.schedule.isEnabled ? "ACTIVE" : "PAUSED"}. Runs every ${res.schedule.frequencyHours}h.`
        });
      } else {
        setScheduleNotice({
          type: "error",
          message: res.error || "Failed to save schedule settings."
        });
      }
    } catch (err: any) {
      setScheduleNotice({
        type: "error",
        message: err?.message || "Failed to save schedule."
      });
    } finally {
      setSavingSchedule(false);
      setTimeout(() => setScheduleNotice(null), 6000);
    }
  };

  // Run Scheduled Discovery Job Immediately
  const handleRunScheduledNow = async () => {
    setTriggeringScheduledRun(true);
    try {
      const res = await triggerScheduledDiscoveryNow();
      if (res.success) {
        setJobNotice({
          type: "success",
          message: `Scheduled discovery triggered immediately (Job ID: ${res.jobId || "Active"}).`
        });
        await fetchJobs();
        await fetchSchedule();
      } else {
        alert(res.error || res.message || "Failed to trigger scheduled run.");
      }
    } catch (err: any) {
      alert(err.message || "Scheduled trigger failed");
    } finally {
      setTriggeringScheduledRun(false);
    }
  };

  // Fetch Jobs
  const fetchJobs = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingJobs(true);
    try {
      const res = await getDiscoveryJobs(15);
      if (res && res.jobs) {
        setJobs(res.jobs);
        setSelectedJob(prev => {
          if (!prev) return null;
          const updated = res.jobs.find(j => (j.jobId || String(j.id)) === (prev.jobId || String(prev.id)));
          return updated ? { ...prev, ...updated } : prev;
        });
      }
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      if (!isBackground) setLoadingJobs(false);
    }
  }, []);

  // Fetch Pending Schemes
  const fetchPendingSchemes = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingPending(true);
    try {
      const res = await getPendingReviewSchemes(reviewFilter === "all" ? "pending_review" : reviewFilter);
      if (res) {
        setPendingSchemes(res);
      }
    } catch (err) {
      console.error("Failed to load pending schemes", err);
    } finally {
      if (!isBackground) setLoadingPending(false);
    }
  }, [reviewFilter]);

  useEffect(() => {
    fetchStatus();
    fetchSchedule();
    fetchJobs();
    fetchPendingSchemes();
  }, [fetchStatus, fetchSchedule, fetchJobs, fetchPendingSchemes]);

  // Auto-refresh jobs and review queue only when an active job is genuinely running
  useEffect(() => {
    const activeJobs = jobs.filter(j => j.status === "running" || j.status === "queued");
    if (activeJobs.length === 0) return;

    // Only poll if the job was started/created recently (within 2 hours)
    const hasRecentActiveJob = activeJobs.some(j => {
      const t = j.startedAt || j.createdAt;
      if (!t) return false;
      return Date.now() - new Date(t).getTime() < 2 * 60 * 60 * 1000;
    });

    if (!hasRecentActiveJob) return;

    const interval = setInterval(() => {
      fetchJobs(true);
      fetchPendingSchemes(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [jobs, fetchJobs, fetchPendingSchemes]);

  // Start Discovery Run
  const handleStartJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setStartingJob(true);
    setJobNotice(null);
    try {
      const res = await startDiscoveryJob({
        state: stateFilter === "all" ? undefined : stateFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        department: departmentInput.trim() || undefined,
        query: customQueryInput.trim() || undefined,
        maxQueries: Number(maxQueriesInput) || 4,
      });

      if (res && res.success) {
        setJobNotice({
          type: "success",
          message: `Discovery job started successfully (ID: ${res.jobId || "Active"}). Background worker running with Google Search Grounding.`
        });
        await fetchJobs();
      } else {
        setJobNotice({
          type: "error",
          message: res?.error || "Failed to start discovery job."
        });
      }
    } catch (err: any) {
      setJobNotice({
        type: "error",
        message: err?.message || "Failed to trigger discovery run."
      });
    } finally {
      setStartingJob(false);
    }
  };

  // Inspect specific job
  const handleSelectJob = async (job: DiscoveryJob) => {
    setSelectedJob(job);
    setViewingLogs(true);
    try {
      const detailed = await getDiscoveryJob(job.jobId || String(job.id));
      if (detailed) {
        setSelectedJob(detailed);
      }
    } catch (err) {
      console.error("Failed to fetch full job details", err);
    }
  };

  // Review Actions
  const handleApprove = async (schemeId: string) => {
    setActionInProgress(true);
    try {
      const res = await approveAdminScheme(schemeId, "Approved by administrator for citizen publication.");
      if (res.success) {
        setSelectedSchemeForReview(null);
        await fetchPendingSchemes();
      } else {
        alert(res.error || "Failed to approve scheme");
      }
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingSchemeId) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setActionInProgress(true);
    try {
      const res = await rejectAdminScheme(rejectingSchemeId, rejectionReason.trim());
      if (res.success) {
        setRejectingSchemeId(null);
        setRejectionReason("");
        setSelectedSchemeForReview(null);
        await fetchPendingSchemes();
      } else {
        alert(res.error || "Failed to reject scheme");
      }
    } catch (err: any) {
      alert(err.message || "Rejection failed");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReverify = async (schemeId: string) => {
    setActionInProgress(true);
    try {
      const res = await reverifyAdminScheme(schemeId, "Flagged for re-verification due to ambiguous official evidence.");
      if (res.success) {
        setSelectedSchemeForReview(null);
        await fetchPendingSchemes();
      } else {
        alert(res.error || "Failed to request re-verification");
      }
    } catch (err: any) {
      alert(err.message || "Re-verification request failed");
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-blue text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Google Gen AI SDK Integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            Gemini Scheme Discovery & Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover genuine Indian central and state government schemes via Google Search Grounding with strict human review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStatus();
              fetchJobs();
              fetchPendingSchemes();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-brand-border text-slate-700 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Gemini Engine Status Card */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              geminiStatus?.connected ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : (geminiStatus?.configured ? "bg-blue-50 text-brand-blue border border-blue-200" : "bg-amber-50 text-amber-600 border border-amber-200")
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-brand-navy">Gemini AI Service Configuration</h2>
                {geminiStatus?.connected ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    Connected & Verified
                  </span>
                ) : geminiStatus?.configured ? (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-brand-blue text-[10px] font-bold">
                    Configured (Ready to Test)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    API Key Missing in backend/.env
                  </span>
                )}
                {geminiStatus?.groundingSupported ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Google Search Grounding: Active
                  </span>
                ) : geminiStatus?.connected ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                    Search Grounding Quota Limited (Direct Extraction)
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Model: <span className="font-mono font-bold text-brand-blue">{geminiStatus?.model || "gemini-3.8-flash"}</span>
                {geminiStatus?.latencyMs ? <span className="ml-2 text-slate-400">| Latency: {geminiStatus.latencyMs}ms</span> : null}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
              <span>{testingConnection ? "Testing Gateway..." : "Test Gemini API Connection"}</span>
            </button>
          </div>
        </div>

        {/* Configuration Notice if not configured */}
        {!geminiStatus?.configured && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold">Gemini API Key is not yet configured.</p>
              <p className="text-amber-800">
                To enable live scheme discovery and AI explanations, configure your key in <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">backend/.env</code>:
              </p>
              <pre className="bg-amber-100/70 p-2 rounded text-[11px] font-mono select-all">
                GEMINI_API_KEY=your_actual_gemini_api_key_here{"\n"}
                GEMINI_MODEL=gemini-3.8-flash
              </pre>
            </div>
          </div>
        )}

        {/* Test Result Message */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-xl text-xs space-y-1.5 ${
            testResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span className="font-bold">{testResult.message}</span>
              </div>
              {testResult.model && (
                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                  Model: {testResult.model} {testResult.latencyMs ? `(${testResult.latencyMs}ms)` : ""}
                </span>
              )}
            </div>
            {testResult.groundingStatus && (
              <p className="text-[11px] text-slate-600 pl-6 border-l-2 border-emerald-400">
                {testResult.groundingStatus}
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1.5: Automated Scheduled Background Discovery */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              scheduleEnabled ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}>
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-brand-navy">Automatic Scheduled Discovery</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  scheduleEnabled ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {scheduleEnabled ? `Active (Every ${scheduleFrequency}h)` : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Runs automatically in the backend background. Does not require an active browser tab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunScheduledNow}
              disabled={triggeringScheduledRun || startingJob}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
              title="Execute discovery pipeline immediately using schedule parameters"
            >
              <Zap className={`w-3.5 h-3.5 ${triggeringScheduledRun ? "animate-spin" : ""}`} />
              <span>{triggeringScheduledRun ? "Triggering..." : "Run Scheduled Job Now"}</span>
            </button>
          </div>
        </div>

        {scheduleNotice && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            scheduleNotice.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-medium">{scheduleNotice.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Schedule Automation Status</label>
            <button
              type="button"
              onClick={() => setScheduleEnabled(!scheduleEnabled)}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                scheduleEnabled
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-brand-border hover:bg-slate-100"
              }`}
            >
              <span>{scheduleEnabled ? "Automatic Discovery ENABLED" : "Automatic Discovery DISABLED"}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${scheduleEnabled ? "bg-white" : "bg-slate-400"}`} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Execution Frequency</label>
            <select
              value={scheduleFrequency}
              onChange={(e) => setScheduleFrequency(Number(e.target.value))}
              className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-brand-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value={6}>Every 6 Hours</option>
              <option value={12}>Every 12 Hours</option>
              <option value={24}>Every 24 Hours (Daily)</option>
              <option value={48}>Every 48 Hours</option>
              <option value={168}>Every 7 Days (Weekly)</option>
            </select>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-brand-border space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 font-bold">Last Run:</span>
              <span className="font-bold text-slate-800">
                {schedule?.lastRunAt ? new Date(schedule.lastRunAt).toLocaleDateString() + " " + new Date(schedule.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "None yet"}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 font-bold">Next Run:</span>
              <span className="font-bold text-purple-700">
                {scheduleEnabled && schedule?.nextRunAt ? new Date(schedule.nextRunAt).toLocaleDateString() + " " + new Date(schedule.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Disabled"}
              </span>
            </div>
          </div>

          <div>
            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="w-full py-2.5 px-4 bg-brand-navy hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCheck className={`w-3.5 h-3.5 ${savingSchedule ? "animate-spin" : ""}`} />
              <span>{savingSchedule ? "Saving Settings..." : "Save Schedule Settings"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Launch New Discovery Run Form */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-brand-blue" />
            <h2 className="text-base font-extrabold text-brand-navy">Launch Grounded Scheme Discovery</h2>
          </div>
          <span className="text-xs text-slate-400">
            Automated deduplication and evidence verification enabled
          </span>
        </div>

        {jobNotice && (
          <div className={`mt-4 p-4 rounded-xl text-xs flex items-center gap-2 ${
            jobNotice.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            {jobNotice.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <p className="font-medium">{jobNotice.message}</p>
          </div>
        )}

        <form onSubmit={handleStartJob} className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">State / Scope</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-brand-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="all">All States & Central Portals</option>
              <option value="Central">Central Government</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-brand-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="all">All Beneficiary Categories</option>
              <option value="Agriculture & Farming">Agriculture & Farming</option>
              <option value="Education & Scholarships">Education & Scholarships</option>
              <option value="Healthcare">Healthcare & Insurance</option>
              <option value="Women & Child Development">Women & Child Development</option>
              <option value="Employment & Skill Development">Employment & Skill Development</option>
              <option value="Housing & Urban Development">Housing & Urban Development</option>
              <option value="Social Welfare & Empowerment">Social Welfare & Empowerment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Department (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Higher Education, Agriculture"
              value={departmentInput}
              onChange={(e) => setDepartmentInput(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-brand-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Max Google Search Queries ({maxQueriesInput})
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={maxQueriesInput}
              onChange={(e) => setMaxQueriesInput(Number(e.target.value))}
              className="w-full accent-brand-blue mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 query</span>
              <span>Default: 4</span>
              <span>10 queries</span>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Custom Search Query (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Maharashtra scholarship schemes for engineering students 2026 official portal"
              value={customQueryInput}
              onChange={(e) => setCustomQueryInput(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-brand-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={startingJob}
              className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${startingJob ? "animate-spin" : ""}`} />
              <span>{startingJob ? "Starting Background Run..." : "Execute Discovery Run"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: Review Queue for Newly Discovered Schemes */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-extrabold text-brand-navy">Discovered Schemes Verification Queue</h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue text-xs font-extrabold border border-blue-200">
                {pendingSchemes.length} schemes awaiting review
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Every scheme discovered by Gemini must be reviewed against official government citations before citizen publication.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-brand-border rounded-xl"
            >
              <option value="all">All Unapproved</option>
              <option value="pending_review">Pending Review</option>
              <option value="needs_verification">Needs Verification</option>
            </select>
            <button
              onClick={() => fetchPendingSchemes(false)}
              className="p-1.5 rounded-lg border border-brand-border hover:bg-slate-50 text-slate-600"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Schemes Table / List */}
        {loadingPending && pendingSchemes.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading pending schemes...</div>
        ) : pendingSchemes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No schemes currently awaiting review</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Run a discovery job above to find and import official government schemes automatically with Google Search Grounding.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Scheme Name</th>
                  <th className="py-3 px-3">State / Level</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">App Window</th>
                  <th className="py-3 px-3">Evidence Sources</th>
                  <th className="py-3 px-3">Review Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {pendingSchemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-brand-navy max-w-xs truncate" title={scheme.name}>
                        {scheme.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {scheme.slug}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700">{scheme.state || "Central"}</span>
                      <div className="text-[10px] text-slate-400 capitalize">{scheme.level || "Central"}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {scheme.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        scheme.applicationStatus === "open"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : scheme.applicationStatus === "closed"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {scheme.applicationStatus || "unknown"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-bold text-brand-blue text-[11px]">
                        <Globe className="w-3 h-3" />
                        {scheme.citations?.length || 0} citations
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        scheme.adminReviewStatus === "pending_review"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}>
                        {scheme.adminReviewStatus || "pending_review"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSchemeForReview(scheme)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
                        >
                          Inspect & Verify
                        </button>
                        <button
                          onClick={() => handleApprove(scheme.id)}
                          disabled={actionInProgress}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                          title="Approve Scheme"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setRejectingSchemeId(scheme.id)}
                          disabled={actionInProgress}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                          title="Reject Scheme"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4: Job Execution History */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <h2 className="text-base font-extrabold text-brand-navy">Discovery Jobs & Audit History</h2>
          </div>
          <button
            onClick={() => fetchJobs()}
            className="p-1.5 rounded-lg border border-brand-border hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? "animate-spin" : ""}`} />
          </button>
        </div>

        {jobs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No discovery jobs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Scope</th>
                  <th className="py-2.5 px-3">Discovered</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3">Updated</th>
                  <th className="py-2.5 px-3">Duplicates</th>
                  <th className="py-2.5 px-3">Time Started</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs font-medium text-slate-700">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {(j.jobId || String(j.id)).slice(0, 8)}...
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        j.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : j.status === "running"
                          ? "bg-blue-50 text-brand-blue border border-blue-200 animate-pulse"
                          : j.status === "failed"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {j.parameters?.state || "All"} / {j.parameters?.category || "All"}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{j.discoveredCount}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">+{j.createdCount}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-600">{j.updatedCount}</td>
                    <td className="py-2.5 px-3 text-slate-500">{j.duplicateCount}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400">
                      {j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleSelectJob(j)}
                        className="text-xs text-brand-blue font-bold hover:underline"
                      >
                        Inspect Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Inspect Scheme Details & Grounding Sources */}
      {selectedSchemeForReview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-brand-border p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-brand-border pb-4">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue text-[10px] font-bold border border-blue-200 uppercase">
                  {selectedSchemeForReview.level || "Central"} Scheme Verification
                </span>
                <h3 className="text-lg font-black text-brand-navy mt-1">
                  {selectedSchemeForReview.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedSchemeForReview.id} | Slug: {selectedSchemeForReview.slug}
                </p>
              </div>
              <button
                onClick={() => setSelectedSchemeForReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scheme Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-brand-border">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                <span className="font-bold text-slate-800">{selectedSchemeForReview.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">State</span>
                <span className="font-bold text-slate-800">{selectedSchemeForReview.state || "All India"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheme Status</span>
                <span className="font-bold text-emerald-700">{selectedSchemeForReview.status || "active"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">App Availability</span>
                <span className="font-bold text-brand-blue">{selectedSchemeForReview.applicationStatus || "unknown"}</span>
              </div>
            </div>

            {/* Description & Benefits */}
            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-brand-navy mb-1">Scheme Summary</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-brand-border/60">
                  {selectedSchemeForReview.shortDescription || selectedSchemeForReview.description}
                </p>
              </div>

              {(selectedSchemeForReview.benefit || selectedSchemeForReview.benefits) && (
                <div>
                  <h4 className="font-bold text-brand-navy mb-1">Direct Benefits</h4>
                  <p className="text-slate-600 leading-relaxed bg-emerald-50/40 p-3 rounded-lg border border-emerald-100">
                    {selectedSchemeForReview.benefit || selectedSchemeForReview.benefits}
                  </p>
                </div>
              )}

              {selectedSchemeForReview.criteria && selectedSchemeForReview.criteria.length > 0 && (
                <div>
                  <h4 className="font-bold text-brand-navy mb-1">Eligibility Criteria Extracted</h4>
                  <ul className="text-slate-600 space-y-1 bg-slate-50/50 p-3 rounded-lg border border-brand-border/60">
                    {selectedSchemeForReview.criteria.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                        <span>{c.name}: {c.condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Official URLs */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-brand-navy">Official Government Portals</h4>
              <div className="space-y-1">
                {selectedSchemeForReview.officialUrl && (
                  <a
                    href={selectedSchemeForReview.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-brand-blue hover:underline break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Official Portal: {selectedSchemeForReview.officialUrl}</span>
                  </a>
                )}
                {selectedSchemeForReview.applicationUrl && (
                  <div className="pt-1">
                    <a
                      href={selectedSchemeForReview.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline break-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Application Form: {selectedSchemeForReview.applicationUrl}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Citations & Evidence List */}
            <div className="space-y-3 pt-2 border-t border-brand-border">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-brand-blue" />
                  Supporting Google Search Citations & Verification Evidence
                </h4>
                <span className="text-[11px] text-slate-400">
                  {selectedSchemeForReview.citations?.length || 0} verified links
                </span>
              </div>

              {(!selectedSchemeForReview.citations || selectedSchemeForReview.citations.length === 0) ? (
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border">
                  No citations attached to this record.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedSchemeForReview.citations.map((cite: any, idx: number) => (
                    <div key={cite.id || idx} className="p-3 rounded-xl bg-slate-50 border border-brand-border text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-brand-navy truncate">{cite.sourceTitle || "Official Source"}</span>
                        {cite.sourceUrl && (
                          <a
                            href={cite.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-blue font-bold flex items-center gap-1 text-[11px] shrink-0 hover:underline"
                          >
                            <span>Visit Domain</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {cite.excerpt && (
                        <p className="text-slate-600 text-[11px] italic bg-white p-2 rounded border border-brand-border/60">
                          &quot;{cite.excerpt}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
              <button
                onClick={() => handleReverify(selectedSchemeForReview.id)}
                disabled={actionInProgress}
                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition"
              >
                Request Re-verification
              </button>
              <button
                onClick={() => {
                  setRejectingSchemeId(selectedSchemeForReview.id);
                  setSelectedSchemeForReview(null);
                }}
                disabled={actionInProgress}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition"
              >
                Reject Scheme
              </button>
              <button
                onClick={() => handleApprove(selectedSchemeForReview.id)}
                disabled={actionInProgress}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Publish to Citizens</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rejection Reason */}
      {rejectingSchemeId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-brand-border">
            <h3 className="text-base font-black text-brand-navy">Reject Discovered Scheme</h3>
            <p className="text-xs text-slate-500">
              Please state why this scheme is being rejected (e.g., discontinued scheme, private service, unverified portal).
            </p>
            <textarea
              rows={3}
              placeholder="Enter rejection reason for audit history..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-brand-border rounded-xl focus:bg-white focus:outline-none"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectingSchemeId(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionInProgress}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Job Execution Logs Viewer */}
      {viewingLogs && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-brand-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="text-base font-black text-brand-navy">
                  Audit Logs: Discovery Job {(selectedJob.jobId || String(selectedJob.id)).slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-400">
                  Status: <span className="font-bold capitalize">{selectedJob.status}</span> | Discovered: {selectedJob.discoveredCount} | Created: {selectedJob.createdCount}
                </p>
              </div>
              <button
                onClick={() => setViewingLogs(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2">
              {(!selectedJob.logs || selectedJob.logs.length === 0) ? (
                <p className="text-slate-500">No logs generated for this job yet.</p>
              ) : (
                selectedJob.logs.map((l: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 border-b border-slate-800 pb-1">
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : "--:--"}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 ${
                      l.level === "ERROR" ? "bg-rose-900 text-rose-300" : l.level === "WARNING" ? "bg-amber-900 text-amber-300" : "bg-blue-900 text-blue-300"
                    }`}>
                      {l.level}
                    </span>
                    <span className="text-slate-300 break-all">{l.message}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingLogs(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
