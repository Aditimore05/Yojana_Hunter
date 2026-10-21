"use client";

import React from "react";
import Link from "next/link";
import { FileText, ArrowRight, Clock, CheckCircle2, Download, ExternalLink } from "lucide-react";
import { fetchApplicationDraft } from "@/services/applicationService";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function ApplicationsPage() {
  const draft = fetchApplicationDraft();

  const applications = [
    {
      id: "APP-VL-8941",
      scheme: "PM Vidyalakshmi Scheme",
      status: "Draft Ready",
      statusColor: "bg-blue-50 text-brand-blue border-blue-200",
      date: "11 Oct 2026",
      desc: "Pre-filled official draft ready for download & submission.",
      href: "/application-draft",
    },
    {
      id: "APP-PMS-1092",
      scheme: "Post Matric Scholarship (State Govt.)",
      status: "Pending Documents",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200",
      date: "09 Oct 2026",
      desc: "Income certificate required before submission.",
      href: "/schemes/post-matric-scholarship",
    },
    {
      id: "APP-SI-4420",
      scheme: "Skill India — Training Program",
      status: "Eligibility Verified",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      date: "05 Oct 2026",
      desc: "Enrollment in approved center is currently in review.",
      href: "/schemes/skill-india-training",
    },
  ];

  return (
    <ProtectedRoute>
      <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              Your Applications &amp; Drafts
            </h1>
            <p className="text-sm text-slate-500">
              Track and manage your government welfare applications
            </p>
          </div>

          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-5 bg-white rounded-2xl border border-brand-border shadow-card hover:shadow-card-hover transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-brand-blue flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-bold text-base sm:text-lg text-brand-navy">
                        {app.scheme}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${app.statusColor}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {app.desc}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ref ID: {app.id} · Updated: {app.date}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <Link
                    href={app.href}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
                  >
                    <span>Review Draft</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
