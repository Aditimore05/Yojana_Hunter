"use client";

import React, { useState, useEffect } from "react";
import { 
  Crown, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Filter, 
  User, 
  Calendar, 
  IndianRupee, 
  ShieldCheck, 
  FileText,
  X,
  AlertTriangle
} from "lucide-react";
import { 
  fetchAdminSubscriptions, 
  approveSubscription, 
  rejectSubscription 
} from "@/services/subscriptionService";
import { 
  SubscriptionRequestRecord, 
  SubscriptionAdminStats 
} from "@/types/subscription";

export default function AdminSubscriptionsPage() {
  const [requests, setRequests] = useState<SubscriptionRequestRecord[]>([]);
  const [stats, setStats] = useState<SubscriptionAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Reject Modal State
  const [rejectModalReq, setRejectModalReq] = useState<SubscriptionRequestRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadData = async (filterTab: string = activeTab) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminSubscriptions(filterTab);
      if (data) {
        setRequests(data.requests || []);
        setStats(data.stats || null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load subscription requests from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handleApprove = async (req: SubscriptionRequestRecord) => {
    const displayName = req.userName || req.user?.name || `User #${req.userId}`;
    if (!confirm(`Are you sure you want to approve ${displayName}'s ${req.planName} subscription? This will grant full premium scheme access immediately.`)) {
      return;
    }

    setActionLoadingId(req.id);
    try {
      const res = await approveSubscription(req.id);
      setSuccessToast(res.message || `Approved subscription for ${displayName}!`);
      setTimeout(() => setSuccessToast(null), 5000);
      await loadData(activeTab);
    } catch (err: any) {
      alert(`Approval failed: ${err?.message || "Internal server error"}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (req: SubscriptionRequestRecord) => {
    setRejectModalReq(req);
    setRejectionReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    const displayName = rejectModalReq.userName || rejectModalReq.user?.name || `User #${rejectModalReq.userId}`;
    setActionLoadingId(rejectModalReq.id);
    try {
      const res = await rejectSubscription(rejectModalReq.id, rejectionReason.trim());
      setSuccessToast(res.message || `Rejected request for ${displayName}.`);
      setTimeout(() => setSuccessToast(null), 5000);
      setRejectModalReq(null);
      await loadData(activeTab);
    } catch (err: any) {
      alert(`Rejection failed: ${err?.message || "Internal server error"}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered requests by search query
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (r.userName || r.user?.name || "").toLowerCase();
    const email = (r.userEmail || r.user?.email || "").toLowerCase();
    const plan = (r.planName || "").toLowerCase();
    return (
      name.includes(q) ||
      email.includes(q) ||
      plan.includes(q) ||
      r.id.toString().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-2xs font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              Manual Admin Approval Engine
            </span>
            <span className="text-2xs text-slate-500">
              Demo Request Workflow (No Real Gateway)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight mt-1">
            Subscription Plan Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review user subscription requests, manually approve premium access, or provide rejection feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(activeTab)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-brand-border text-slate-700 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <RefreshCw className={`w-4 h-4 text-brand-blue ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Requests</span>
          </button>
        </div>
      </div>

      {/* Success Alert Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-700 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => loadData(activeTab)}
            className="text-xs font-bold underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-2xs font-extrabold uppercase tracking-wider">Total Requests</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-brand-navy">
            {stats ? stats.total : "—"}
          </p>
          <p className="text-2xs text-slate-500">All submitted plan requests</p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-2xs font-extrabold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-800">
            {stats ? stats.pending : "—"}
          </p>
          <p className="text-2xs text-amber-600 font-medium">Awaiting admin action</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-2xs font-extrabold uppercase tracking-wider">Approved Subscriptions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800">
            {stats ? stats.approved : "—"}
          </p>
          <p className="text-2xs text-emerald-600 font-medium">Currently accessing all schemes</p>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-2xs font-extrabold uppercase tracking-wider">Rejected Requests</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-800">
            {stats ? stats.rejected : "—"}
          </p>
          <p className="text-2xs text-rose-600 font-medium">Declined demo requests</p>
        </div>
      </div>

      {/* Main Content Area: Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-card overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "pending"
                  ? "bg-white text-amber-800 shadow-xs"
                  : "text-slate-600 hover:text-brand-navy"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending</span>
              {stats && stats.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-3xs font-black bg-amber-200 text-amber-900">
                  {stats.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("approved")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "approved"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-600 hover:text-brand-navy"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Approved</span>
              {stats && stats.approved > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-3xs font-black bg-emerald-200 text-emerald-900">
                  {stats.approved}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "rejected"
                  ? "bg-white text-rose-800 shadow-xs"
                  : "text-slate-600 hover:text-brand-navy"
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Rejected</span>
              {stats && stats.rejected > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-3xs font-black bg-rose-200 text-rose-900">
                  {stats.rejected}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-white text-brand-navy shadow-xs"
                  : "text-slate-600 hover:text-brand-navy"
              }`}
            >
              <span>All Requests</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>
        </div>

        {/* Requests List Table */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-brand-blue animate-spin mx-auto" />
            <p className="text-slate-500 font-bold text-xs">Loading subscription records from PostgreSQL...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Crown className="w-6 h-6" />
            </div>
            <p className="text-slate-600 font-bold text-sm">No subscription requests found in this filter.</p>
            <p className="text-xs text-slate-400">
              {activeTab === "pending"
                ? "All user subscription requests have been reviewed!"
                : "No records match the current status or search query."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-3xs tracking-wider">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Selected Plan</th>
                  <th className="py-3 px-4">Price / Duration</th>
                  <th className="py-3 px-4">Requested Date</th>
                  <th className="py-3 px-4">Status & Validity</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const isPending = req.status === "Pending" || (req.status as any) === "pending";
                  const isApproved = req.status === "Approved" || (req.status as any) === "approved";
                  const isRejected = req.status === "Rejected" || (req.status as any) === "rejected";
                  const uName = req.userName || req.user?.name || `User #${req.userId}`;
                  const uEmail = req.userEmail || req.user?.email || `ID: ${req.userId}`;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      {/* User Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-brand-blue font-black flex items-center justify-center text-xs shrink-0">
                            {uName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-brand-navy text-xs">
                              {uName}
                            </p>
                            <p className="text-2xs text-slate-400 font-medium">
                              {uEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-slate-800">{req.planName}</span>
                        </div>
                        <span className="text-3xs text-slate-400 uppercase tracking-wider font-semibold">
                          Plan ID: {req.planId}
                        </span>
                      </td>

                      {/* Price / Duration */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">
                          {req.currency} {req.amount}
                        </div>
                        <div className="text-2xs text-slate-500 font-medium">
                          {req.durationDays} Days validity
                        </div>
                      </td>

                      {/* Requested Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                        </div>
                        <div className="text-3xs text-slate-400">
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </td>

                      {/* Status & Validity */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Approval</span>
                          </span>
                        )}

                        {isApproved && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                            {req.startsAt && req.expiresAt && (
                              <div className="text-3xs text-slate-500 font-medium">
                                Valid: {new Date(req.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {new Date(req.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                            )}
                          </div>
                        )}

                        {isRejected && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                            {req.rejectionReason && (
                              <p className="text-3xs text-rose-600 font-medium italic truncate max-w-[180px]" title={req.rejectionReason}>
                                Reason: "{req.rejectionReason}"
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={actionLoadingId === req.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xs shadow-xs transition disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{actionLoadingId === req.id ? "Approving..." : "Approve"}</span>
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(req)}
                              disabled={actionLoadingId === req.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-2xs transition disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : isApproved ? (
                          <span className="text-3xs font-bold text-emerald-700 uppercase tracking-wider">
                            Active Plan
                          </span>
                        ) : (
                          <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider">
                            Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Confirmation Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-brand-border space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-brand-navy">Reject Subscription Request</h3>
                  <p className="text-2xs text-slate-500">User will remain on the Free Tier (5-scheme limit)</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalReq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div><strong>User:</strong> {rejectModalReq.userName || rejectModalReq.user?.name || `User #${rejectModalReq.userId}`} ({rejectModalReq.userEmail || rejectModalReq.user?.email || `ID: ${rejectModalReq.userId}`})</div>
              <div><strong>Selected Plan:</strong> {rejectModalReq.planName} (₹{rejectModalReq.amount} / {rejectModalReq.durationDays} Days)</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Internal Rejection Reason (Optional):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Demo request rejected, user profile incomplete, or test cycle ended..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 min-h-[90px]"
              />
              <p className="text-3xs text-slate-400">
                This note will be recorded in the subscription history and displayed on the user's status modal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoadingId === rejectModalReq.id}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition disabled:opacity-50"
              >
                {actionLoadingId === rejectModalReq.id ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
