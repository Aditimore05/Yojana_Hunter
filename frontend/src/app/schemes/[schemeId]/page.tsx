"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  ShieldCheck, 
  Calendar, 
  IndianRupee, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { getSchemeById } from "@/services/schemeService";
import { Scheme } from "@/types/scheme";
import { EligibilityBadge } from "@/components/schemes/EligibilityBadge";

export default function SchemeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const schemeId = (params?.schemeId as string) || "pm-vidyalakshmi";
  const [scheme, setScheme] = useState<Scheme | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getSchemeById(schemeId);
      if (data) setScheme(data);
    }
    load();
  }, [schemeId]);

  if (!scheme) {
    return (
      <main className="flex-1 bg-brand-bg py-12 px-4 flex justify-center items-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-brand-border">
          <p className="text-slate-600 font-bold">Loading scheme details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-blue hover:text-brand-blue-dark transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        {/* Scheme Header Card */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <GraduationCap className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-brand-navy">
                    {scheme.name}
                  </h1>
                  <EligibilityBadge status={scheme.eligibilityStatus} />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {scheme.shortDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 text-xs font-semibold pt-2 border-t border-slate-100 flex-wrap">
            <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-700">
              {scheme.department}
            </span>
            <span className="px-3 py-1 rounded-md bg-blue-50 text-brand-blue">
              {scheme.level}
            </span>
          </div>
        </div>

        {/* Eligibility Details Table Card */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
          <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
            Eligibility Details
          </h2>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {scheme.criteria.map((crit) => (
              <div
                key={crit.id}
                className="p-3.5 flex items-center justify-between gap-4 text-xs sm:text-sm bg-white hover:bg-slate-50 transition"
              >
                <div className="w-1/3 font-semibold text-slate-700">
                  {crit.name}
                </div>
                <div className="w-1/3 text-slate-600 font-medium text-center">
                  {crit.condition}
                </div>
                <div className="w-1/3 flex justify-end">
                  {crit.passed ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pass</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Ineligible</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Green Eligibility Summary Card */}
        {scheme.eligibilityStatus === "eligible" ? (
          <div className="p-6 bg-status-eligible-bg border border-status-eligible-border rounded-2xl shadow-card space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>You are eligible for this scheme!</span>
            </div>
            <p className="text-xs text-emerald-700 font-medium">Benefit:</p>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 flex items-center gap-1">
              <span>{scheme.benefit}</span>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-card space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-base">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>Almost Eligible</span>
            </div>
            <p className="text-xs text-amber-700 font-medium">
              Complete remaining requirement to unlock this welfare benefit: {scheme.benefit}
            </p>
          </div>
        )}

        {/* Official Source Card */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-3">
          <h3 className="font-extrabold text-sm sm:text-base text-brand-navy">
            Official Source
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <a
              href={scheme.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-brand-blue hover:underline"
            >
              <span>{scheme.officialUrl}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-1 text-slate-500 font-medium text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Verified: {scheme.lastVerifiedDate}</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-1/2 py-3.5 px-6 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-center text-sm transition"
          >
            View Full Guidelines
          </a>
          <button
            onClick={() => router.push("/action-plan")}
            className="w-full sm:w-1/2 py-3.5 px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-center text-sm shadow-md transition"
          >
            Start Application
          </button>
        </div>
      </div>
    </main>
  );
}
