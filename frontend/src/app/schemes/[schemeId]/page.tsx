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
  Calendar, 
  Sparkles,
  HelpCircle,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  Bookmark,
  Loader2
} from "lucide-react";
import { getSchemeById } from "@/services/schemeService";
import { Scheme } from "@/types/scheme";
import { EligibilityBadge } from "@/components/schemes/EligibilityBadge";
import { useAuth } from "@/context/AuthContext";
import { saveScheme, removeSavedScheme, checkIsSaved } from "@/services/savedSchemeService";

export default function SchemeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const schemeId = (params?.schemeId as string) || "pm-vidyalakshmi";
  const { isAuthenticated } = useAuth();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getSchemeById(schemeId);
      if (data) {
        setScheme(data);
        if (isAuthenticated) {
          checkIsSaved(data.slug || data.id).then(setIsSaved);
        }
      }
      setLoading(false);
    }
    load();
  }, [schemeId, isAuthenticated]);

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/schemes/${schemeId}`);
      return;
    }
    if (!scheme) return;
    setSaving(true);
    const targetId = scheme.slug || scheme.id;
    if (isSaved) {
      await removeSavedScheme(targetId);
      setIsSaved(false);
    } else {
      await saveScheme(targetId);
      setIsSaved(true);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="flex-1 bg-brand-bg py-12 px-4 flex justify-center items-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-brand-border">
          <p className="text-slate-600 font-bold">Evaluating eligibility and loading scheme details...</p>
        </div>
      </main>
    );
  }

  if (!scheme) {
    return (
      <main className="flex-1 bg-brand-bg py-12 px-4 flex justify-center items-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-brand-border space-y-3">
          <p className="text-rose-600 font-bold text-base">Scheme not found or unpublished.</p>
          <Link
            href="/schemes"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-blue underline"
          >
            Return to schemes catalog
          </Link>
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
          <span>Back to All Schemes</span>
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

            {/* Bookmark button */}
            <button
              onClick={handleToggleBookmark}
              disabled={saving}
              title={isSaved ? "Saved to your bookmarks" : "Save this scheme"}
              className={`p-2.5 rounded-xl transition border flex items-center gap-1.5 text-xs font-bold shrink-0 ${
                isSaved
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:text-brand-blue hover:bg-slate-100"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              ) : (
                <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
              )}
              <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>

          {/* Department & Level Tags */}
          <div className="flex items-center gap-2 text-xs font-semibold pt-2 border-t border-slate-100 flex-wrap">
            <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{scheme.department || "Government of India"}</span>
            </span>
            <span className="px-3 py-1 rounded-md bg-blue-50 text-brand-blue">
              {scheme.level || "Central Scheme"}
            </span>
            <span className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-800">
              State: {scheme.state || "All India"}
            </span>
            {scheme.applicationStatus && scheme.applicationStatus !== "open" && (
              <span className={`px-3 py-1 rounded-md font-bold uppercase text-2xs ${
                scheme.applicationStatus === "closed" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
              }`}>
                Window: {scheme.applicationStatus.replace("_", " ")}
              </span>
            )}
          </div>
        </div>

        {/* "Why am I seeing this scheme?" Transparent Match Explanation Card */}
        <div className="p-6 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200 rounded-2xl shadow-card space-y-3">
          <div className="flex items-center gap-2 text-brand-navy font-black text-base sm:text-lg">
            <Sparkles className="w-5 h-5 text-brand-blue shrink-0" />
            <span>Why am I seeing this scheme?</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {scheme.whyMatched || `Based on your profile, your age, residency, and qualification match the target criteria for ${scheme.name}.`}
          </p>
          {scheme.matchScore !== undefined && (
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-slate-600 font-semibold">Match Confidence:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-white border border-blue-200 text-brand-blue shadow-2xs">
                {scheme.matchScore}% Relevance
              </span>
            </div>
          )}
        </div>

        {/* Benefits Card */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-3">
          <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
            Welfare Benefits
          </h2>
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <p className="text-sm sm:text-base font-bold text-emerald-900 whitespace-pre-line">
              {scheme.benefit || scheme.benefits}
            </p>
          </div>
        </div>

        {/* Requirements Breakdown: Satisfied vs Not Satisfied */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
          <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
            Eligibility Requirements Analysis
          </h2>

          {/* Requirements Satisfied */}
          {scheme.requirementsSatisfied && scheme.requirementsSatisfied.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Requirements Satisfied ({scheme.requirementsSatisfied.length})</span>
              </h3>
              <ul className="space-y-1.5 pl-1">
                {scheme.requirementsSatisfied.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements Not Satisfied */}
          {scheme.requirementsNotSatisfied && scheme.requirementsNotSatisfied.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Requirements Not Met ({scheme.requirementsNotSatisfied.length})</span>
              </h3>
              <ul className="space-y-1.5 pl-1">
                {scheme.requirementsNotSatisfied.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-rose-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Information Alert */}
          {scheme.missingInformation && scheme.missingInformation.length > 0 && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Missing Information for Verification</span>
              </div>
              <ul className="space-y-1 pl-1">
                {scheme.missingInformation.map((item, idx) => (
                  <li key={idx} className="text-xs text-amber-900 font-medium flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-1">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 underline"
                >
                  <span>Update your citizen profile now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Required Documents Card */}
        {scheme.requiredDocuments && scheme.requiredDocuments.length > 0 && (
          <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-brand-navy flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-blue" />
              <span>Required Documents</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {scheme.requiredDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Application Process Card */}
        {scheme.applicationProcess && (
          <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
              Application Procedure
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {scheme.applicationProcess}
            </p>
          </div>
        )}

        {/* Official Source & Verification Card */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-3">
          <h3 className="font-extrabold text-sm sm:text-base text-brand-navy">
            Official Government Source & Verification
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Official Portal:</span>
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-brand-blue hover:underline break-all"
              >
                <span>{scheme.officialUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>

            {scheme.applicationUrl && scheme.applicationUrl !== scheme.officialUrl && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Application Link:</span>
                <a
                  href={scheme.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline break-all"
                >
                  <span>{scheme.applicationUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500 text-xs">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Last Verified Date: {scheme.lastVerifiedDate || "12 Oct 2026"}</span>
              </span>
              <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Official Government Portal
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-1/2 py-3.5 px-6 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-center text-sm transition"
          >
            Official Guidelines
          </a>
          {scheme.applicationUrl ? (
            <a
              href={scheme.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-1/2 py-3.5 px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-center text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Apply on Official Portal</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button
              onClick={() => router.push("/action-plan")}
              className="w-full sm:w-1/2 py-3.5 px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-center text-sm shadow-md transition"
            >
              Start Application
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
