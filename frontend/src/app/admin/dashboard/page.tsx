"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  CheckCircle2, 
  FileClock, 
  Archive, 
  PlusCircle, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  ExternalLink,
  Eye,
  Edit,
  Clock
} from "lucide-react";
import { getAdminDashboard } from "@/services/adminService";
import { AdminDashboardStats } from "@/types/admin";
import { Scheme } from "@/types/scheme";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboard();
      if (data) {
        setStats(data);
      } else {
        setError("Failed to load statistics from database.");
      }
    } catch {
      setError("Network error while connecting to Flask API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            Scheme Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time PostgreSQL overview of active, draft, and archived government schemes.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-brand-border text-slate-700 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
            title="Refresh database statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/schemes"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-brand-border text-brand-navy rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <Layers className="w-4 h-4 text-brand-blue" />
            <span>Manage Schemes</span>
          </Link>

          <Link
            href="/admin/schemes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Scheme</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-700 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg font-bold text-xs hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Real Database 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Schemes */}
        <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Schemes
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-brand-blue">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <div className="text-3xl font-black text-brand-navy">
                {stats?.totalSchemes ?? 0}
              </div>
            )}
            <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
              In PostgreSQL registry
            </span>
          </div>
        </div>

        {/* Published Schemes */}
        <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Published
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <div className="text-3xl font-black text-emerald-600">
                {stats?.publishedSchemes ?? 0}
              </div>
            )}
            <span className="text-[11px] font-semibold text-emerald-600/80 mt-1 block">
              Live on Citizen Portal
            </span>
          </div>
        </div>

        {/* Draft Schemes */}
        <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Draft Schemes
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <FileClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <div className="text-3xl font-black text-amber-600">
                {stats?.draftSchemes ?? 0}
              </div>
            )}
            <span className="text-[11px] font-semibold text-amber-600/80 mt-1 block">
              Unpublished / Hidden
            </span>
          </div>
        </div>

        {/* Archived Schemes */}
        <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Archived
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <div className="text-3xl font-black text-slate-600">
                {stats?.archivedSchemes ?? 0}
              </div>
            )}
            <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
              Inactive / Historical
            </span>
          </div>
        </div>
      </div>

      {/* Recent Schemes Table Card */}
      <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-brand-navy">
              Recently Managed Schemes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest additions and status changes from PostgreSQL
            </p>
          </div>
          <Link
            href="/admin/schemes"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-blue-dark transition"
          >
            <span>View All Schemes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && (!stats?.recentSchemes || stats.recentSchemes.length === 0) && (
          <div className="py-12 text-center space-y-3 border-2 border-dashed border-slate-100 rounded-xl">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-700">No schemes registered yet</h3>
              <p className="text-xs text-slate-400">
                Click below to add your first government scheme to the database.
              </p>
            </div>
            <Link
              href="/admin/schemes/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-brand-blue-dark transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Scheme</span>
            </Link>
          </div>
        )}

        {/* Table Content */}
        {!loading && stats?.recentSchemes && stats.recentSchemes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Scheme Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Level / State</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Benefit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {stats.recentSchemes.map((scheme: Scheme) => {
                  const status = scheme.status || (scheme.isActive ? "published" : "draft");
                  return (
                    <tr key={scheme.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-brand-navy">
                          {scheme.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {scheme.shortDescription}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {scheme.category || "General"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="text-xs font-medium">
                          {scheme.level || "Central"}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {scheme.state || "All India"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {status === "published" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Published
                          </span>
                        )}
                        {status === "draft" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        )}
                        {status === "archived" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {scheme.benefit || scheme.benefits || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/schemes/${scheme.slug || scheme.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"
                            title="Edit Scheme"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          {status === "published" && (
                            <Link
                              href={`/schemes/${scheme.slug || scheme.id}`}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-brand-teal hover:bg-teal-50 rounded-lg transition"
                              title="View on Citizen Portal"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
