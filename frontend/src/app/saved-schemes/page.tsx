"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Bookmark, 
  BookmarkCheck, 
  Trash2, 
  ExternalLink, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getSavedSchemes, removeSavedScheme } from "@/services/savedSchemeService";
import { Scheme } from "@/types/scheme";
import { EligibilityBadge } from "@/components/schemes/EligibilityBadge";

function SavedSchemesContent() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSavedSchemes();
      setSchemes(data);
    } catch {
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemove = async (schemeId: string, schemeName: string) => {
    setRemovingId(schemeId);
    try {
      const res = await removeSavedScheme(schemeId);
      if (res.success) {
        setSchemes((prev) => prev.filter((s) => s.id !== schemeId && s.slug !== schemeId));
        setActionMessage(`Removed "${schemeName}" from your saved schemes.`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } finally {
      setRemovingId(null);
    }
  };

  const eligibleCount = schemes.filter((s) => s.eligibilityStatus === "eligible").length;
  const almostCount = schemes.filter((s) => s.eligibilityStatus === "almost" || s.eligibilityStatus === "possibly_eligible").length;

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-brand-blue mb-2">
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Personal Bookmarks</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              My Saved Schemes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Government schemes you have bookmarked for tracking, document preparation, and application.
            </p>
          </div>

          <Link
            href="/schemes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white text-xs sm:text-sm font-bold shadow-xs transition shrink-0"
          >
            <Layers className="w-4 h-4" />
            <span>Discover More Schemes</span>
          </Link>
        </div>

        {/* Action toast message */}
        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Summary Stats Cards */}
        {schemes.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs">
              <span className="text-2xs sm:text-xs font-semibold text-slate-500">Total Bookmarks</span>
              <p className="text-lg sm:text-2xl font-black text-brand-navy mt-0.5">{schemes.length}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs">
              <span className="text-2xs sm:text-xs font-semibold text-emerald-600">Eligible Now</span>
              <p className="text-lg sm:text-2xl font-black text-emerald-600 mt-0.5">{eligibleCount}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs">
              <span className="text-2xs sm:text-xs font-semibold text-amber-600">Action Needed</span>
              <p className="text-lg sm:text-2xl font-black text-amber-600 mt-0.5">{almostCount}</p>
            </div>
          </div>
        )}

        {/* Schemes List */}
        {loading ? (
          <div className="p-12 bg-white rounded-2xl border border-brand-border flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
            <span className="text-sm font-medium text-slate-500">Loading your saved schemes...</span>
          </div>
        ) : schemes.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-brand-border shadow-card flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-blue">
              <Bookmark className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-extrabold text-brand-navy">No Saved Schemes Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                You haven't bookmarked any schemes yet. Explore verified central and state welfare opportunities and save them for quick reference.
              </p>
            </div>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-sm shadow-md transition"
            >
              <span>Explore Schemes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {schemes.map((scheme) => {
              const schemeIdentifier = scheme.slug || scheme.id;
              const isRemoving = removingId === schemeIdentifier || removingId === scheme.id;
              const officialUrl = scheme.applicationUrl || scheme.officialUrl;

              return (
                <div
                  key={scheme.id}
                  className="p-4 sm:p-5 bg-white rounded-2xl border border-brand-border shadow-card hover:shadow-card-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-base sm:text-lg text-brand-navy">
                        {scheme.name}
                      </h3>
                      <EligibilityBadge status={scheme.eligibilityStatus} size="sm" />
                    </div>

                    <div className="flex items-center gap-2 text-2xs text-slate-500 flex-wrap">
                      <span className="font-medium text-slate-600">{scheme.department || "Government of India"}</span>
                      <span>·</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {scheme.level || "Central Scheme"} ({scheme.state || "All India"})
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                      {scheme.shortDescription || scheme.description}
                    </p>

                    {scheme.benefit && (
                      <div className="text-xs text-slate-600">
                        Benefit: <span className="font-semibold text-slate-900">{scheme.benefit}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center sm:flex-col sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-2">
                      {officialUrl && (
                        <a
                          href={officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition border border-slate-200"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </a>
                      )}

                      <Link
                        href={`/schemes/${schemeIdentifier}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue-dark shadow-xs transition"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleRemove(schemeIdentifier, scheme.name)}
                        disabled={isRemoving}
                        title="Remove from saved bookmarks"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                      >
                        {isRemoving ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SavedSchemesPage() {
  return (
    <ProtectedRoute>
      <SavedSchemesContent />
    </ProtectedRoute>
  );
}
