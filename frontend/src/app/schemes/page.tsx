"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Sparkles } from "lucide-react";
import { getSchemes } from "@/services/schemeService";
import { Scheme, EligibilityStatus } from "@/types/scheme";
import { SchemeCard } from "@/components/schemes/SchemeCard";

export default function SchemesPage() {
  const [activeFilter, setActiveFilter] = useState<EligibilityStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [allSchemesCount, setAllSchemesCount] = useState({
    all: 12,
    eligible: 6,
    almost: 3,
    ineligible: 3,
  });

  useEffect(() => {
    async function loadData() {
      const data = await getSchemes();
      setAllSchemesCount({
        all: data.length,
        eligible: data.filter((s) => s.eligibilityStatus === "eligible").length,
        almost: data.filter((s) => s.eligibilityStatus === "almost").length,
        ineligible: data.filter((s) => s.eligibilityStatus === "ineligible").length,
      });
    }
    loadData();
  }, []);

  useEffect(() => {
    async function filterData() {
      const filtered = await getSchemes(activeFilter, searchQuery);
      setSchemes(filtered);
    }
    filterData();
  }, [activeFilter, searchQuery]);

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Your Top Scheme Matches
          </h1>
          <p className="text-sm text-slate-500">
            Based on your profile, here are the best matching schemes.
          </p>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* 4 Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-brand-blue text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
              }`}
            >
              All ({allSchemesCount.all})
            </button>
            <button
              onClick={() => setActiveFilter("eligible")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeFilter === "eligible"
                  ? "bg-brand-blue text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
              }`}
            >
              Eligible ({allSchemesCount.eligible})
            </button>
            <button
              onClick={() => setActiveFilter("almost")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeFilter === "almost"
                  ? "bg-brand-blue text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
              }`}
            >
              Almost Eligible ({allSchemesCount.almost})
            </button>
            <button
              onClick={() => setActiveFilter("ineligible")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeFilter === "ineligible"
                  ? "bg-brand-blue text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
              }`}
            >
              Not Eligible ({allSchemesCount.ineligible})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scheme name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>
        </div>

        {/* Vertical Scheme Cards List */}
        <div className="space-y-4">
          {schemes.length > 0 ? (
            schemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-brand-border">
              <p className="text-slate-500 font-semibold text-sm">
                No schemes match your selected criteria.
              </p>
              <button
                onClick={() => {
                  setActiveFilter("all");
                  setSearchQuery("");
                }}
                className="mt-3 text-xs font-bold text-brand-blue underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
