"use client";

import React from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileUp, 
  ExternalLink, 
  FileText, 
  Clock, 
  MessageSquare
} from "lucide-react";
import { demoActionPlanSteps } from "@/data/demoData";
import { EligibilityBadge } from "@/components/schemes/EligibilityBadge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function ActionPlanContent() {
  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Your Action Plan
          </h1>
          <p className="text-sm text-slate-500">
            Here's what you need to do to apply for your top schemes.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-card p-6 space-y-6">
          {/* Scheme Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-brand-navy">
                  PM Vidyalakshmi Scheme
                </h2>
                <p className="text-xs text-slate-400 font-medium">Next Steps</p>
              </div>
            </div>

            <EligibilityBadge status="eligible" />
          </div>

          {/* 4 Vertical Numbered Steps */}
          <div className="space-y-4">
            {demoActionPlanSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-xl border border-brand-border bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-brand-blue text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {step.stepNumber}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-brand-navy">
                      {step.title}
                    </h3>
                    {step.statusText && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="text-emerald-700 font-medium">Aadhaar Card (Uploaded)</span> ·{" "}
                        <span className="text-rose-600 font-semibold">Income Certificate (missing)</span>
                      </p>
                    )}
                    {step.description && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <Link
                    href={step.actionUrl || "#"}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-brand-blue bg-white border border-brand-blue/30 hover:bg-blue-50 hover:border-brand-blue rounded-xl shadow-xs transition"
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Need Help? Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-brand-blue shrink-0 shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-brand-navy">Need Help?</h4>
                <p className="text-xs text-slate-600">Talk to our assistant</p>
              </div>
            </div>

            <Link
              href="/interview"
              className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs sm:text-sm shadow-sm transition text-center"
            >
              Chat with Yojana Hunter
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ActionPlanPage() {
  return (
    <ProtectedRoute>
      <ActionPlanContent />
    </ProtectedRoute>
  );
}
