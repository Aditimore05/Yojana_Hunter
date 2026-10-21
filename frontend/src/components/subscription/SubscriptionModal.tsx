"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  Crown, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Info, 
  Check, 
  Minus,
  RotateCcw,
  RefreshCw,
  Zap
} from "lucide-react";
import { 
  fetchSubscriptionPlans, 
  fetchMySubscriptionStatus, 
  submitSubscriptionRequest, 
  cancelSubscriptionRequest 
} from "@/services/subscriptionService";
import { 
  SubscriptionPlan, 
  PlanComparisonRow, 
  UserSubscriptionStatus, 
  SubscriptionPlanId 
} from "@/types/subscription";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionUpdated?: () => void;
  initialPlanId?: SubscriptionPlanId;
  totalMatchingCount?: number;
  accessibleCount?: number;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  onSubscriptionUpdated,
  initialPlanId = "yearly",
  totalMatchingCount,
  accessibleCount = 5
}: SubscriptionModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [comparison, setComparison] = useState<PlanComparisonRow[]>([]);
  const [status, setStatus] = useState<UserSubscriptionStatus | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>(initialPlanId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  
  // Confirmation step state
  const [showConfirm, setShowConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [notes, setNotes] = useState("");

  const loadPlansAndStatus = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [plansData, userStatus] = await Promise.all([
        fetchSubscriptionPlans(),
        fetchMySubscriptionStatus()
      ]);
      setPlans(plansData.plans);
      setComparison(plansData.comparison);
      setStatus(userStatus);

      if (userStatus?.pending_request) {
        setSelectedPlanId((userStatus.pending_request.planId as SubscriptionPlanId) || "yearly");
      }
    } catch {
      // Handled gracefully via fallback in service
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPlansAndStatus();
      setShowConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleOpenConfirm = (planId: SubscriptionPlanId) => {
    setSelectedPlanId(planId);
    setShowConfirm(true);
    setFeedback(null);
  };

  const handleSubmitRequest = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    setFeedback(null);

    const res = await submitSubscriptionRequest(selectedPlan.id, notes);
    setSubmitting(false);

    if (res.success) {
      setFeedback({
        type: "success",
        message: res.message
      });
      setShowConfirm(false);
      // Reload status
      const updatedStatus = await fetchMySubscriptionStatus();
      setStatus(updatedStatus);
      if (onSubscriptionUpdated) onSubscriptionUpdated();
    } else {
      setFeedback({
        type: "error",
        message: res.message
      });
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    if (!confirm("Are you sure you want to cancel your pending subscription request?")) return;
    setCancelling(true);
    setFeedback(null);

    const res = await cancelSubscriptionRequest(requestId);
    setCancelling(false);

    if (res.success) {
      setFeedback({
        type: "info",
        message: res.message
      });
      const updatedStatus = await fetchMySubscriptionStatus();
      setStatus(updatedStatus);
      if (onSubscriptionUpdated) onSubscriptionUpdated();
    } else {
      setFeedback({
        type: "error",
        message: res.message
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-gradient-to-b from-slate-900 via-slate-900 to-brand-navy border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="relative px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Yojana Hunter <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Premium Access</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  OTT Tier
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unlock all matching government schemes, full application procedures, and direct portal links
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Banners */}
          {feedback && (
            <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 border ${
              feedback.type === "success" 
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200" 
                : feedback.type === "error"
                ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                : "bg-blue-950/40 border-blue-500/40 text-blue-200"
            }`}>
              {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Active Premium Banner */}
          {status?.is_premium && status.active_subscription && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Active Subscription
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      {status.days_remaining} Days Remaining
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {status.active_subscription.planName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Valid until {new Date(status.active_subscription.expiresAt || "").toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. You currently have full unrestricted access to all government schemes.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 self-start sm:self-auto">
                Status: Approved & Active
              </span>
            </div>
          )}

          {/* Pending Request Banner */}
          {status?.pending_request && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Request Pending Approval
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {status.pending_request.planName} (₹{status.pending_request.amount})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Submitted on {new Date(status.pending_request.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Awaiting admin approval. Premium access will be enabled once approved.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCancelRequest(status.pending_request!.id)}
                disabled={cancelling}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 transition shrink-0 self-start sm:self-auto"
              >
                {cancelling ? "Cancelling..." : "Cancel Request"}
              </button>
            </div>
          )}

          {/* Previous Rejection Banner (if any) */}
          {!status?.is_premium && !status?.pending_request && status?.latest_request?.status === "rejected" && (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold text-rose-200">
                  Your previous subscription request for {status.latest_request.planName} was rejected.
                </p>
                {status.latest_request.rejectionReason && (
                  <p className="text-rose-300/80 text-xs mt-0.5">
                    Reason: {status.latest_request.rejectionReason}
                  </p>
                )}
                <p className="text-slate-400 text-xs mt-1">
                  You remain on the Free plan and can submit a new subscription request below.
                </p>
              </div>
            </div>
          )}

          {/* Context Notice for Free Users with more matching schemes */}
          {typeof totalMatchingCount === "number" && totalMatchingCount > accessibleCount && !status?.is_premium && (
            <div className="p-4 rounded-2xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-blue/20 text-brand-blue flex items-center justify-center font-bold text-xs shrink-0">
                  {totalMatchingCount}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-white">
                    You have {totalMatchingCount} matching government schemes!
                  </p>
                  <p className="text-xs text-slate-400">
                    Free accounts are limited to complete details of only the first {accessibleCount} schemes. Upgrade below to view all {totalMatchingCount} schemes.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-xl text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                +{totalMatchingCount - accessibleCount} Schemes Locked
              </span>
            </div>
          )}

          {/* Manual Approval Demo Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3 text-xs text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Demo Subscription Workflow:</strong> No real money or credit card/UPI is deducted. Once you click &quot;Subscribe Now&quot;, your request is saved as Pending in PostgreSQL and activated manually by the administrator.
            </span>
          </div>

          {/* 3 OTT-STYLE SUBSCRIPTION CARDS */}
          {loading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading subscription tiers...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isPendingForThis = status?.pending_request?.planId === plan.id;
                const isActiveForThis = status?.active_subscription?.planId === plan.id;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-3xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-gradient-to-b from-slate-800/90 to-slate-900 border-2 border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]"
                        : "bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 hover:border-slate-600"
                    }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap ${
                          plan.popular 
                            ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950" 
                            : "bg-brand-blue text-white"
                        }`}>
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Plan Header */}
                      <div className="border-b border-slate-700/60 pb-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-extrabold text-white">
                            {plan.name}
                          </h3>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {plan.description}
                        </p>

                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-white">
                            ₹{plan.price}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            / {plan.duration_label}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-300/80 font-medium mt-0.5">
                          Validity: {plan.duration_days} days
                        </p>
                      </div>

                      {/* Feature Bullet points */}
                      <ul className="space-y-2.5 pt-1 text-xs text-slate-300">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6">
                      {isActiveForThis ? (
                        <button
                          disabled
                          className="w-full py-3 rounded-2xl font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                        >
                          Current Active Plan
                        </button>
                      ) : isPendingForThis ? (
                        <button
                          disabled
                          className="w-full py-3 rounded-2xl font-bold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-default"
                        >
                          Request Pending
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenConfirm(plan.id);
                          }}
                          className={`w-full py-3 rounded-2xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20"
                              : "bg-slate-700 hover:bg-slate-600 text-white"
                          }`}
                        >
                          <span>Subscribe Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CONFIRMATION MODAL OVERLAY */}
          {showConfirm && selectedPlan && (
            <div className="p-6 rounded-3xl bg-slate-800/90 border border-amber-400/60 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Confirm Subscription Request: {selectedPlan.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Amount: ₹{selectedPlan.price} • Duration: {selectedPlan.duration_days} Days ({selectedPlan.duration_label})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-xs space-y-2 text-slate-300">
                <p className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Demo Mode — No Real Payment Processing</span>
                </p>
                <p>
                  Clicking <strong>&quot;Submit Subscription Request&quot;</strong> will record your request with status <code>Pending</code> in PostgreSQL. No credit card, UPI, or actual charge is taken.
                </p>
                <p className="text-slate-400 text-[11px]">
                  An administrator will review and approve your request from the Admin Dashboard, which will activate full access to all matching government schemes.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  Optional note to administrator:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Requesting yearly plan for farmer/student access"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit Subscription Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* FREE VS PREMIUM COMPARISON TABLE */}
          {comparison.length > 0 && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Feature Comparison: Free Citizen vs Premium Pass
                </h4>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-black uppercase text-slate-400">
                      <th className="py-3 px-4">Feature</th>
                      <th className="py-3 px-4 text-slate-400">Free Citizen Tier</th>
                      <th className="py-3 px-4 text-amber-300 font-bold bg-amber-500/10">Premium Citizen Pass</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {comparison.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/20 transition">
                        <td className="py-3 px-4 font-medium text-white">{row.feature}</td>
                        <td className="py-3 px-4 text-slate-400">{row.free}</td>
                        <td className="py-3 px-4 font-bold text-amber-300 bg-amber-500/5">{row.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Administrator manual approval workflow • Zero payment gateway integration</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-300 hover:text-white"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
