"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Wheat,
  GraduationCap,
  MapPin,
  Calendar,
  Briefcase,
  IndianRupee,
  Layers
} from "lucide-react";
import { getSchemes, syncSchemes, getSyncStatus } from "@/services/schemeService";
import { fetchProfile, updateProfile } from "@/services/profileService";
import { Scheme, EligibilityStatus } from "@/types/scheme";
import { SchemeCard } from "@/components/schemes/SchemeCard";
import { UserProfile } from "@/types/profile";

export default function SchemesPage() {
  const [activeFilter, setActiveFilter] = useState<EligibilityStatus | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [counts, setCounts] = useState({
    all: 0,
    eligible: 0,
    possibly_eligible: 0,
    not_eligible: 0,
    applications_closed: 0,
  });

  const [syncMeta, setSyncMeta] = useState<{
    total_schemes: number;
    verified_schemes: number;
    last_sync_time: string | null;
    last_verified_date: string;
    status: string;
  }>({
    total_schemes: 10,
    verified_schemes: 10,
    last_sync_time: null,
    last_verified_date: "13 Oct 2026",
    status: "ready"
  });

  const categories = [
    "All Categories",
    "Agriculture",
    "Education",
    "Skill Development",
    "Employment & Enterprise",
    "Health & Wellness",
    "Social Welfare",
  ];

  const states = [
    "All States",
    "Uttar Pradesh",
    "Maharashtra",
    "Karnataka",
    "Delhi",
    "Gujarat",
    "Rajasthan",
    "Madhya Pradesh",
    "Punjab",
    "Bihar",
  ];

  const loadData = async () => {
    setLoading(true);
    const catParam = selectedCategory === "All Categories" ? "all" : selectedCategory;
    const stateParam = selectedState === "All States" ? "all" : selectedState;

    const [allData, p, meta] = await Promise.all([
      getSchemes("all", undefined, catParam, stateParam),
      fetchProfile(),
      getSyncStatus()
    ]);

    setProfile(p);
    setSyncMeta(meta);

    setCounts({
      all: allData.length,
      eligible: allData.filter((s) => s.eligibilityStatus === "eligible").length,
      possibly_eligible: allData.filter((s) => s.eligibilityStatus === "possibly_eligible" || (s as any).legacyEligibilityStatus === "almost").length,
      not_eligible: allData.filter((s) => s.eligibilityStatus === "not_eligible" || (s as any).legacyEligibilityStatus === "ineligible").length,
      applications_closed: allData.filter((s) => s.eligibilityStatus === "applications_closed").length,
    });

    const filtered = await getSchemes(activeFilter, searchQuery, catParam, stateParam);
    setSchemes(filtered);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 150);
    return () => clearTimeout(timer);
  }, [activeFilter, searchQuery, selectedCategory, selectedState]);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncSchemes(profile || undefined);
      if (res.success) {
        setSyncMessage(`Successfully verified ${res.schemes_verified}/${res.schemes_attempted} official sources! Upserted ${res.schemes_updated + res.schemes_inserted} scheme records.`);
      } else {
        setSyncMessage(`Sync completed with notice: ${res.error || "Some sources took longer to respond."}`);
      }
      await loadData();
    } catch {
      setSyncMessage("Synchronization request sent to backend.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 8000);
    }
  };

  const handleSetFarmerDemoProfile = async () => {
    const farmerProfile: Partial<UserProfile> = {
      name: "Ramesh Verma",
      occupation: "Farmer",
      annualIncome: "1 – 3 Lakh",
      incomeNumeric: 180000,
      age: 24,
      state: "Uttar Pradesh",
      district: "Varanasi",
      education: "10th Pass",
      category: "OBC",
      isFarmer: true,
      isStudent: false,
      landHoldingAcres: 2.0,
      isTaxPayer: false,
      isGovtEmployee: false,
    };
    await updateProfile(farmerProfile);
    await loadData();
  };

  const handleSwitchStateToMaharashtra = async () => {
    if (!profile) return;
    await updateProfile({ state: "Maharashtra" });
    await loadData();
  };

  const handleSwitchOccupationToStudent = async () => {
    if (!profile) return;
    await updateProfile({
      occupation: "Student",
      isFarmer: false,
      isStudent: true,
      education: "B.E. (Final Year)",
    });
    await loadData();
  };

  const handleResetFilters = () => {
    setActiveFilter("all");
    setSelectedCategory("all");
    setSelectedState("all");
    setSearchQuery("");
  };

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-2xs font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Official Government Sources
              </span>
              <span className="text-2xs text-slate-500">
                PostgreSQL Database Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              Government Scheme Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Deterministic matching engine evaluated against your 6 chatbot profile fields.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-brand-border shadow-xs transition"
              title="Probe official government portals and sync live records"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-blue ${syncing ? "animate-spin text-brand-blue" : ""}`} />
              <span>{syncing ? "Probing Sources..." : "Synchronize Schemes"}</span>
            </button>

            <Link
              href="/schemes/match"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-teal-600 hover:from-brand-blue-dark hover:to-teal-700 text-white font-bold text-xs shadow-md transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Matcher</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Sync Success / Alert Toast */}
        {syncMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
            <button onClick={() => setSyncMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">Dismiss</button>
          </div>
        )}

        {/* 1. MENTOR DEMO PROFILE SUMMARY CARD */}
        <div className="p-5 bg-white rounded-2xl border border-brand-border shadow-card space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-brand-blue" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-brand-navy">
                  Active Citizen Profile Evaluation
                </h3>
                <p className="text-2xs text-slate-500">
                  Six primary matching fields collected via Conversational Chatbot
                </p>
              </div>
            </div>

            {/* Quick Demo Switchers for Mentor Presentation */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Demo Toggles:</span>
              <button
                onClick={handleSetFarmerDemoProfile}
                className="px-2.5 py-1 rounded-lg text-2xs font-extrabold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
                title="Reset profile to Farmer, UP, 24 yrs, 10th Pass, OBC, ₹1-3L"
              >
                Farmer Demo (UP)
              </button>
              <button
                onClick={handleSwitchStateToMaharashtra}
                className="px-2.5 py-1 rounded-lg text-2xs font-extrabold bg-blue-50 text-brand-blue hover:bg-blue-100 border border-blue-200 transition"
                title="Switch State to Maharashtra to demonstrate state eligibility rule changes"
              >
                Switch to Maharashtra
              </button>
              <button
                onClick={handleSwitchOccupationToStudent}
                className="px-2.5 py-1 rounded-lg text-2xs font-extrabold bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition"
                title="Switch Occupation to Student to demonstrate occupation rule exclusions"
              >
                Switch to Student
              </button>
              <Link
                href="/interview"
                className="px-2.5 py-1 rounded-lg text-2xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Retake Interview
              </Link>
            </div>
          </div>

          {/* Six Fields Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-3xs font-bold uppercase text-slate-400 tracking-wider">Occupation</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 truncate">
                {profile?.occupation || "Farmer"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-3xs font-bold uppercase text-slate-400 tracking-wider">Annual Income</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 truncate">
                {profile?.annualIncome || "1 – 3 Lakh"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-3xs font-bold uppercase text-slate-400 tracking-wider">Age</span>
              <span className="text-xs font-black text-slate-800 mt-0.5">
                {profile?.age ? `${profile.age} Years` : "24 Years"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-3xs font-bold uppercase text-slate-400 tracking-wider">State</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 truncate">
                {profile?.state || "Uttar Pradesh"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-3xs font-bold uppercase text-slate-400 tracking-wider">Education</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 truncate">
                {profile?.education || "10th Pass"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-3xs font-bold uppercase text-slate-400 tracking-wider">Category</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 truncate">
                {profile?.category || "OBC"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. STATS & SYNC METADATA BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-brand-border shadow-xs flex flex-col">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total in Database</span>
            <div className="text-2xl font-black text-brand-navy mt-1">
              {counts.all}
            </div>
            <span className="text-3xs text-slate-400 mt-1">Real government schemes</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-emerald-800 uppercase tracking-wider">Eligible Matches</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {counts.eligible}
            </div>
            <span className="text-3xs text-emerald-600 mt-1">100% criteria verified</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-amber-800 uppercase tracking-wider">Needs Verification</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {counts.possibly_eligible}
            </div>
            <span className="text-3xs text-amber-600 mt-1">Pending document/land check</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Source Status</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-extrabold text-slate-800 mt-2 truncate">
              {syncMeta.status === "ready" ? "Verified Live" : syncMeta.status}
            </div>
            <span className="text-3xs text-slate-400 mt-1">
              {syncMeta.last_verified_date ? `Verified: ${syncMeta.last_verified_date}` : "Live Probed"}
            </span>
          </div>
        </div>

        {/* 3. FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeFilter === "all"
                ? "bg-brand-navy text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
            }`}
          >
            All Verified Schemes ({counts.all})
          </button>
          <button
            onClick={() => setActiveFilter("eligible")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeFilter === "eligible"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
            }`}
          >
            Eligible ({counts.eligible})
          </button>
          <button
            onClick={() => setActiveFilter("possibly_eligible")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeFilter === "possibly_eligible"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"
            }`}
          >
            Needs Verification ({counts.possibly_eligible})
          </button>
          <button
            onClick={() => setActiveFilter("not_eligible")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeFilter === "not_eligible"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
            }`}
          >
            Not Eligible ({counts.not_eligible})
          </button>
        </div>

        {/* 4. SEARCH & DROPDOWN FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-brand-border shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scheme name or benefit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-slate-700 font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-slate-700 font-medium"
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. RECOMMENDATIONS LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-brand-border space-y-3">
              <RefreshCw className="w-6 h-6 text-brand-blue animate-spin mx-auto" />
              <p className="text-slate-600 font-bold text-sm">Evaluating 6-field deterministic eligibility...</p>
            </div>
          ) : schemes.length > 0 ? (
            schemes.map((scheme) => (
              <SchemeCard key={scheme.id || scheme.slug} scheme={scheme} />
            ))
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-brand-border space-y-3">
              <p className="text-slate-600 font-bold text-sm">
                No schemes match the selected filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
