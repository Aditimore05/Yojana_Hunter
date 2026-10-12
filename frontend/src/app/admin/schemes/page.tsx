"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Archive, 
  Send, 
  Eye, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  X,
  Layers,
  ChevronDown,
  Building,
  GraduationCap
} from "lucide-react";
import { 
  getAdminSchemes, 
  updateAdminSchemeStatus, 
  deleteAdminScheme 
} from "@/services/adminService";
import { Scheme, SchemeStatus } from "@/types/scheme";

export default function AdminManageSchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals & confirmation
  const [viewScheme, setViewScheme] = useState<Scheme | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Scheme | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSchemes({
        q: searchQuery,
        category: selectedCategory,
        state: selectedState,
        status: selectedStatus,
      });
      setSchemes(data);
    } catch {
      setError("Failed to fetch schemes from PostgreSQL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchemes();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedState, selectedStatus]);

  const handleStatusChange = async (scheme: Scheme, newStatus: SchemeStatus) => {
    setActionLoading(true);
    try {
      const res = await updateAdminSchemeStatus(scheme.slug || scheme.id, newStatus);
      if (res.success) {
        setActionSuccess(`Scheme "${scheme.name}" status updated to ${newStatus}.`);
        fetchSchemes();
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        setError(res.error || "Failed to update status.");
      }
    } catch {
      setError("Error changing scheme status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await deleteAdminScheme(deleteTarget.slug || deleteTarget.id);
      if (res.success) {
        setActionSuccess(`Scheme "${deleteTarget.name}" deleted successfully.`);
        setDeleteTarget(null);
        fetchSchemes();
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        setError(res.error || "Failed to delete scheme.");
      }
    } catch {
      setError("Error executing delete.");
    } finally {
      setActionLoading(false);
    }
  };

  const categories = [
    "All Categories",
    "Education",
    "Agriculture",
    "Skill Development",
    "Health & Wellness",
    "Financial Support",
    "Housing & Shelter",
    "Women & Child Welfare",
    "Social Welfare",
  ];

  const states = [
    "All States",
    "All India",
    "Maharashtra",
    "Delhi",
    "Karnataka",
    "Tamil Nadu",
    "Uttar Pradesh",
    "Gujarat",
    "Rajasthan",
    "Madhya Pradesh",
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            Manage Government Schemes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, edit, publish drafts, and archive records in the PostgreSQL registry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSchemes}
            className="p-2.5 bg-white border border-brand-border text-slate-600 hover:bg-slate-50 rounded-xl transition shadow-xs"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/schemes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Scheme</span>
          </Link>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs sm:text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-rose-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters Card */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search box (5 cols) */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme name or department..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published (Live)</option>
              <option value="draft">Draft (Hidden)</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category Filter (2 cols) */}
          <div className="sm:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value === "All Categories" ? "all" : e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
            >
              {categories.map((c) => (
                <option key={c} value={c === "All Categories" ? "all" : c}>{c}</option>
              ))}
            </select>
          </div>

          {/* State Filter (2 cols) */}
          <div className="sm:col-span-2">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value === "All States" ? "all" : e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
            >
              {states.map((st) => (
                <option key={st} value={st === "All States" ? "all" : st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick status tabs count */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              selectedStatus === "all"
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({schemes.length})
          </button>
          <button
            onClick={() => setSelectedStatus("published")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              selectedStatus === "published"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setSelectedStatus("draft")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              selectedStatus === "draft"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setSelectedStatus("archived")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              selectedStatus === "archived"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Schemes List Card */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-card overflow-hidden">
        {/* Loading State */}
        {loading && (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && schemes.length === 0 && (
          <div className="py-16 text-center space-y-3 px-4">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-700">No schemes found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No scheme matches the current search or filter criteria in the database.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedState("all");
                setSelectedStatus("all");
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Table View */}
        {!loading && schemes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Scheme</th>
                  <th className="py-3 px-4">Category & Department</th>
                  <th className="py-3 px-4">Level & State</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Benefits</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {schemes.map((scheme) => {
                  const status = scheme.status || (scheme.isActive ? "published" : "draft");
                  return (
                    <tr key={scheme.id} className="hover:bg-slate-50/70 transition group">
                      {/* Name & short description */}
                      <td className="py-4 px-4 sm:px-6 max-w-xs">
                        <div className="font-extrabold text-brand-navy group-hover:text-brand-blue transition">
                          {scheme.name}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {scheme.shortDescription}
                        </p>
                      </td>

                      {/* Category & Department */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-700 block">
                          {scheme.category || "General"}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                          {scheme.department || "Govt"}
                        </span>
                      </td>

                      {/* Level & State */}
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold text-brand-navy block">
                          {scheme.level || "Central"}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {scheme.state || "All India"}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {status === "published" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Published
                          </span>
                        )}
                        {status === "draft" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        )}
                        {status === "archived" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Benefit */}
                      <td className="py-4 px-4 font-bold text-emerald-700 max-w-[150px] truncate">
                        {scheme.benefit || scheme.benefits || "N/A"}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick View */}
                          <button
                            onClick={() => setViewScheme(scheme)}
                            className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Scheme */}
                          <Link
                            href={`/admin/schemes/${scheme.slug || scheme.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"
                            title="Edit Scheme"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Quick Publish Action if Draft */}
                          {status === "draft" && (
                            <button
                              onClick={() => handleStatusChange(scheme, "published")}
                              disabled={actionLoading}
                              className="p-1.5 text-amber-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Publish Draft Now"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick Archive Action if Published */}
                          {status === "published" && (
                            <button
                              onClick={() => handleStatusChange(scheme, "archived")}
                              disabled={actionLoading}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                              title="Archive Scheme"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick Restore if Archived */}
                          {status === "archived" && (
                            <button
                              onClick={() => handleStatusChange(scheme, "published")}
                              disabled={actionLoading}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Restore & Publish"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete with modal confirmation */}
                          <button
                            onClick={() => setDeleteTarget(scheme)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Scheme"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* View Scheme Details Modal */}
      {viewScheme && (
        <div className="fixed inset-0 z-50 bg-brand-navy/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-floating border border-brand-border">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {viewScheme.category} • {viewScheme.level}
                </span>
                <h3 className="text-xl font-black text-brand-navy mt-1">
                  {viewScheme.name}
                </h3>
              </div>
              <button
                onClick={() => setViewScheme(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <span className="font-bold text-slate-700 block">Short Description:</span>
                <p className="text-slate-600 mt-0.5">{viewScheme.shortDescription}</p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block">Full Description:</span>
                <p className="text-slate-600 mt-0.5 whitespace-pre-line">{viewScheme.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50">
                <div>
                  <span className="font-bold text-slate-700 block">Benefits:</span>
                  <span className="text-emerald-700 font-extrabold block mt-0.5">
                    {viewScheme.benefit || viewScheme.benefits}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">Department:</span>
                  <span className="text-slate-600 block mt-0.5">{viewScheme.department}</span>
                </div>
              </div>

              {viewScheme.requiredDocuments && viewScheme.requiredDocuments.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Required Documents:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewScheme.requiredDocuments.map((d) => (
                      <span key={d} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-700 block mb-1">Official Links:</span>
                <div className="space-y-1">
                  <a
                    href={viewScheme.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-blue hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>{viewScheme.officialUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {viewScheme.applicationUrl && (
                    <a
                      href={viewScheme.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Application Portal: {viewScheme.applicationUrl}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/admin/schemes/${viewScheme.slug || viewScheme.id}/edit`}
                className="px-4 py-2 bg-brand-blue text-white rounded-xl font-bold text-xs hover:bg-brand-blue-dark transition"
              >
                Edit Scheme
              </Link>
              <button
                onClick={() => setViewScheme(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-brand-navy/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-floating border border-brand-border">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-brand-navy">
                Delete Government Scheme?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Are you sure you want to permanently delete{" "}
                <span className="font-bold text-brand-navy">
                  &ldquo;{deleteTarget.name}&rdquo;
                </span>
                ? This will remove all associated eligibility rules and document requirements from PostgreSQL.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs"
              >
                {actionLoading ? "Deleting..." : "Yes, Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
