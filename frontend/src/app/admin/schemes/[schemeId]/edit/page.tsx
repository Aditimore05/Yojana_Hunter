"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Send, 
  X, 
  Plus, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  Archive
} from "lucide-react";
import { getAdminScheme, updateAdminScheme } from "@/services/adminService";
import { SchemeFormData } from "@/types/admin";
import { Scheme } from "@/types/scheme";

export default function EditSchemePage() {
  const params = useParams();
  const router = useRouter();
  const schemeId = (params?.schemeId as string) || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newDocInput, setNewDocInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SchemeFormData>({
    name: "",
    shortDescription: "",
    description: "",
    category: "Education",
    department: "",
    level: "Central Scheme",
    state: "All India",
    benefits: "",
    officialUrl: "",
    applicationUrl: "",
    sourceUrl: "",
    applicationProcess: "",
    ageMin: "",
    ageMax: "",
    incomeMax: "",
    occupation: "",
    education: "",
    startDate: "",
    endDate: "",
    requiredDocuments: [],
    status: "draft",
    priority: "High Priority",
  });

  useEffect(() => {
    async function loadScheme() {
      if (!schemeId) return;
      setLoading(true);
      try {
        const scheme = await getAdminScheme(schemeId);
        if (scheme) {
          setFormData({
            name: scheme.name || "",
            shortDescription: scheme.shortDescription || "",
            description: scheme.description || "",
            category: scheme.category || "General",
            department: scheme.department || "",
            level: scheme.level || "Central Scheme",
            state: scheme.state || "All India",
            benefits: scheme.benefits || scheme.benefit || "",
            officialUrl: scheme.officialUrl || "",
            applicationUrl: scheme.applicationUrl || "",
            sourceUrl: scheme.sourceUrl || "",
            applicationProcess: scheme.applicationProcess || "",
            ageMin: scheme.ageMin !== undefined && scheme.ageMin !== null ? scheme.ageMin : "",
            ageMax: scheme.ageMax !== undefined && scheme.ageMax !== null ? scheme.ageMax : "",
            incomeMax: scheme.incomeMax !== undefined && scheme.incomeMax !== null ? scheme.incomeMax : "",
            occupation: scheme.occupation || "",
            education: scheme.education || "",
            startDate: scheme.startDate ? scheme.startDate.substring(0, 10) : "",
            endDate: scheme.endDate ? scheme.endDate.substring(0, 10) : "",
            requiredDocuments: scheme.requiredDocuments || [],
            status: scheme.status || (scheme.isActive ? "published" : "draft"),
            priority: scheme.priority || "High Priority",
          });
        } else {
          setServerError("Scheme not found in database.");
        }
      } catch {
        setServerError("Failed to load scheme details.");
      } finally {
        setLoading(false);
      }
    }

    loadScheme();
  }, [schemeId]);

  const categories = [
    "Education",
    "Agriculture",
    "Skill Development",
    "Health & Wellness",
    "Financial Support",
    "Housing & Shelter",
    "Women & Child Welfare",
    "Senior Citizens",
    "Social Welfare",
    "Employment & Enterprise",
    "Other",
  ];

  const states = [
    "All India",
    "Maharashtra",
    "Delhi",
    "Karnataka",
    "Tamil Nadu",
    "Uttar Pradesh",
    "Gujarat",
    "Rajasthan",
    "Madhya Pradesh",
    "West Bengal",
    "Punjab",
    "Haryana",
    "Bihar",
    "Kerala",
    "Andhra Pradesh",
    "Telangana",
    "Assam",
    "Odisha",
  ];

  const handleAddDocument = () => {
    if (newDocInput.trim() && !formData.requiredDocuments.includes(newDocInput.trim())) {
      setFormData({
        ...formData,
        requiredDocuments: [...formData.requiredDocuments, newDocInput.trim()],
      });
      setNewDocInput("");
    }
  };

  const handleRemoveDocument = (doc: string) => {
    setFormData({
      ...formData,
      requiredDocuments: formData.requiredDocuments.filter((d) => d !== doc),
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Scheme name is required.";
    if (!formData.shortDescription.trim()) errs.shortDescription = "Short summary is required.";
    if (!formData.description.trim()) errs.description = "Full description is required.";
    if (!formData.department.trim()) errs.department = "Department name is required.";
    if (!formData.benefits.trim()) errs.benefits = "Benefits details are required.";

    const urlRegex = /^(https?:\/\/)/i;
    if (!formData.officialUrl.trim()) {
      errs.officialUrl = "Official scheme URL is required.";
    } else if (!urlRegex.test(formData.officialUrl.trim())) {
      errs.officialUrl = "Must start with http:// or https://";
    }

    if (formData.applicationUrl.trim() && !urlRegex.test(formData.applicationUrl.trim())) {
      errs.applicationUrl = "Must start with http:// or https://";
    }

    if (formData.sourceUrl.trim() && !urlRegex.test(formData.sourceUrl.trim())) {
      errs.sourceUrl = "Must start with http:// or https://";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (overrideStatus?: "draft" | "published" | "archived") => {
    setServerError(null);
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<SchemeFormData> = {
        ...formData,
        status: overrideStatus || formData.status,
      };

      const res = await updateAdminScheme(schemeId, payload);
      if (res.success) {
        router.push("/admin/schemes?updated=true");
      } else {
        setServerError(res.error || "Failed to update scheme.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setServerError("Network error communicating with Flask backend.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue mx-auto" />
        <p className="text-sm font-bold text-slate-500">Loading scheme from database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/schemes"
            className="p-2 rounded-xl bg-white border border-brand-border text-slate-600 hover:text-brand-blue hover:bg-slate-50 transition"
            title="Back to Schemes"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-navy">
              Edit Government Scheme
            </h1>
            <p className="text-xs text-slate-500">
              Update details, eligibility criteria limits, and publication status.
            </p>
          </div>
        </div>

        <Link
          href="/admin/schemes"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          Cancel
        </Link>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-card p-6 sm:p-8 space-y-8">
        {/* Status selector */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-navy block">Current Scheme Status</span>
            <span className="text-[11px] text-slate-500">
              Only Published schemes are visible to citizens.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: "published" })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                formData.status === "published"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Published
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: "draft" })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                formData.status === "draft"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: "archived" })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                formData.status === "archived"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {/* Section 1: Basic Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Basic Scheme Information
          </h2>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Scheme Name *</span>
                {errors.name && <span className="text-rose-500 text-[11px] font-medium">{errors.name}</span>}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Short Summary *</span>
                {errors.shortDescription && <span className="text-rose-500 text-[11px] font-medium">{errors.shortDescription}</span>}
              </label>
              <input
                type="text"
                required
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Full Official Description *</span>
                {errors.description && <span className="text-rose-500 text-[11px] font-medium">{errors.description}</span>}
              </label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
              >
                <option value="Central Scheme">Central Scheme</option>
                <option value="State Scheme">State Scheme</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">State</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
              >
                {states.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Benefits */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Benefits & Process
          </h2>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Benefits *</span>
                {errors.benefits && <span className="text-rose-500 text-[11px] font-medium">{errors.benefits}</span>}
              </label>
              <input
                type="text"
                required
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Application Process</label>
              <textarea
                rows={3}
                value={formData.applicationProcess}
                onChange={(e) => setFormData({ ...formData, applicationProcess: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Criteria Limits */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Eligibility Limits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Min Age</label>
              <input
                type="number"
                value={formData.ageMin}
                onChange={(e) => setFormData({ ...formData, ageMin: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Max Age</label>
              <input
                type="number"
                value={formData.ageMax}
                onChange={(e) => setFormData({ ...formData, ageMax: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Max Income (₹)</label>
              <input
                type="number"
                value={formData.incomeMax}
                onChange={(e) => setFormData({ ...formData, incomeMax: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Occupation</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Education</label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Required Documents */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">
            4. Required Documents
          </h2>

          <div className="flex flex-wrap gap-2 min-h-10 p-3 rounded-xl border border-brand-border bg-slate-50/50">
            {formData.requiredDocuments.map((doc) => (
              <span
                key={doc}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-brand-border text-brand-navy shadow-2xs"
              >
                <span>{doc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(doc)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newDocInput}
              onChange={(e) => setNewDocInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDocument();
                }
              }}
              placeholder="Add another required document..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
            />
            <button
              type="button"
              onClick={handleAddDocument}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* Section 5: Official URLs & Dates */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">
            5. Official URLs & Dates
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Official Scheme URL *</span>
                {errors.officialUrl && <span className="text-rose-500 text-[11px] font-medium">{errors.officialUrl}</span>}
              </label>
              <input
                type="url"
                required
                value={formData.officialUrl}
                onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Application URL</label>
                <input
                  type="url"
                  value={formData.applicationUrl}
                  onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Source URL</label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <Link
            href="/admin/schemes"
            className="w-full sm:w-auto px-5 py-2.5 text-center bg-white hover:bg-slate-50 border border-brand-border text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition"
          >
            Cancel
          </Link>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave("draft")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs sm:text-sm rounded-xl transition disabled:opacity-60"
            >
              <Save className="w-4 h-4 text-amber-600" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave("published")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Publish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
