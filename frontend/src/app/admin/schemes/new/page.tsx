"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Send, 
  X, 
  Plus, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  Layers,
  Eye
} from "lucide-react";
import { createAdminScheme } from "@/services/adminService";
import { SchemeFormData } from "@/types/admin";

export default function NewSchemePage() {
  const router = useRouter();

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
    applicationStatus: "open",
    ageMin: "",
    ageMax: "",
    incomeMax: "",
    occupation: "",
    education: "",
    gender: "All",
    socialCategory: "All",
    isFarmerOnly: false,
    maxLandholdingAcres: "",
    isStudentOnly: false,
    isBusinessOnly: false,
    isDisabilityRequired: false,
    exclusions: [],
    startDate: "",
    endDate: "",
    requiredDocuments: ["Aadhaar Card"],
    status: "draft",
    priority: "High Priority",
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [newDocInput, setNewDocInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

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

  const handleRemoveDocument = (docToRemove: string) => {
    setFormData({
      ...formData,
      requiredDocuments: formData.requiredDocuments.filter((d) => d !== docToRemove),
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) errs.name = "Scheme name is required.";
    if (!formData.shortDescription.trim()) errs.shortDescription = "Short summary is required.";
    if (!formData.description.trim()) errs.description = "Full description is required.";
    if (!formData.department.trim()) errs.department = "Department name is required.";
    if (!formData.benefits.trim()) errs.benefits = "Benefits summary is required.";

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

  const handleSubmit = async (targetStatus: "draft" | "published") => {
    setServerError(null);
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      const payload: SchemeFormData = {
        ...formData,
        status: targetStatus,
      };

      const res = await createAdminScheme(payload);
      if (res.success) {
        router.push("/admin/schemes?created=true");
      } else {
        setServerError(res.error || "Failed to save scheme to database.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setServerError("Network error communicating with Flask backend.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/schemes"
            className="p-2 rounded-xl bg-white border border-brand-border text-slate-600 hover:text-brand-blue hover:bg-slate-50 transition"
            title="Back to Scheme List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-navy">
              Add New Government Scheme
            </h1>
            <p className="text-xs text-slate-500">
              Create and publish official government welfare schemes directly to PostgreSQL.
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

      {/* Global Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-card p-6 sm:p-8 space-y-8">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <span>1. Basic Scheme Information</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {/* Scheme Name */}
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
                placeholder="e.g. Pradhan Mantri Awas Yojana (Urban)"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-brand-navy focus:outline-none transition ${
                  errors.name ? "border-rose-400 bg-rose-50/30" : "border-brand-border focus:border-brand-blue"
                }`}
              />
            </div>

            {/* Short Summary */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Short Summary (1-2 sentences) *</span>
                {errors.shortDescription && <span className="text-rose-500 text-[11px] font-medium">{errors.shortDescription}</span>}
              </label>
              <input
                type="text"
                required
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="e.g. Financial subsidy for pucca house construction in urban areas"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-brand-navy focus:outline-none transition ${
                  errors.shortDescription ? "border-rose-400 bg-rose-50/30" : "border-brand-border focus:border-brand-blue"
                }`}
              />
            </div>

            {/* Full Description */}
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
                placeholder="Comprehensive background, objectives, and scope of the scheme..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-brand-navy focus:outline-none transition ${
                  errors.description ? "border-rose-400 bg-rose-50/30" : "border-brand-border focus:border-brand-blue"
                }`}
              />
            </div>
          </div>

          {/* Category, Department, Level, State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category *</label>
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
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Ministry / Department *</span>
                {errors.department && <span className="text-rose-500 text-[11px] font-medium">{errors.department}</span>}
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Ministry of Housing and Urban Affairs"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-brand-navy focus:outline-none transition ${
                  errors.department ? "border-rose-400 bg-rose-50/30" : "border-brand-border focus:border-brand-blue"
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Government Level *</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
              >
                <option value="Central Scheme">Central Scheme (Government of India)</option>
                <option value="State Scheme">State Scheme (State Government)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Applicable State *</label>
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

        {/* Section 2: Benefits & Application Process */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <span>2. Benefits & Application Process</span>
          </h2>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Benefits (Amount / Subsidy / Equipment) *</span>
                {errors.benefits && <span className="text-rose-500 text-[11px] font-medium">{errors.benefits}</span>}
              </label>
              <input
                type="text"
                required
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="e.g. Up to ₹2.67 Lakh interest subsidy on home loan"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-brand-navy focus:outline-none transition ${
                  errors.benefits ? "border-rose-400 bg-rose-50/30" : "border-brand-border focus:border-brand-blue"
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Application Process & Steps (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.applicationProcess}
                onChange={(e) => setFormData({ ...formData, applicationProcess: e.target.value })}
                placeholder="Step 1: Register on portal. Step 2: Upload documents. Step 3: Bank verification..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Eligibility Criteria */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider">
              3. Eligibility Criteria Limits
            </h2>
            <span className="text-[11px] font-medium text-slate-400">
              Leave blank if no restriction applies
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Minimum Age</label>
              <input
                type="number"
                min={0}
                max={120}
                value={formData.ageMin}
                onChange={(e) => setFormData({ ...formData, ageMin: e.target.value })}
                placeholder="e.g. 18"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Maximum Age</label>
              <input
                type="number"
                min={0}
                max={120}
                value={formData.ageMax}
                onChange={(e) => setFormData({ ...formData, ageMax: e.target.value })}
                placeholder="e.g. 35"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Max Family Annual Income (₹)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={formData.incomeMax}
                onChange={(e) => setFormData({ ...formData, incomeMax: e.target.value })}
                placeholder="e.g. 300000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Occupation Requirements</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g. Farmer, Student, Artisan, Self-employed"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Education Requirements</label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="e.g. 10th Pass, 12th Pass, Graduate, Diploma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          {/* Demographics: Gender & Social Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Target Gender</label>
              <select
                value={formData.gender || "All"}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
              >
                <option value="All">All Genders</option>
                <option value="Female">Female Only</option>
                <option value="Male">Male Only</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Social Category</label>
              <select
                value={formData.socialCategory || "All"}
                onChange={(e) => setFormData({ ...formData, socialCategory: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
              >
                <option value="All">All Social Categories</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="OBC">OBC (Other Backward Classes)</option>
                <option value="General">General Category</option>
                <option value="Minority">Minority</option>
              </select>
            </div>
          </div>

          {/* Specific Beneficiary Checkboxes */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-brand-navy block uppercase tracking-wider">
              Beneficiary Constraints
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isFarmerOnly)}
                  onChange={(e) => setFormData({ ...formData, isFarmerOnly: e.target.checked })}
                  className="rounded text-brand-blue focus:ring-brand-blue/30 w-4 h-4"
                />
                <span>Farmer Beneficiaries Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isStudentOnly)}
                  onChange={(e) => setFormData({ ...formData, isStudentOnly: e.target.checked })}
                  className="rounded text-brand-blue focus:ring-brand-blue/30 w-4 h-4"
                />
                <span>Students / Enrolled Youths Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isBusinessOnly)}
                  onChange={(e) => setFormData({ ...formData, isBusinessOnly: e.target.checked })}
                  className="rounded text-brand-blue focus:ring-brand-blue/30 w-4 h-4"
                />
                <span>Business Owners / MSME Entrepreneurs Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isDisabilityRequired)}
                  onChange={(e) => setFormData({ ...formData, isDisabilityRequired: e.target.checked })}
                  className="rounded text-brand-blue focus:ring-brand-blue/30 w-4 h-4"
                />
                <span>Divyangjan / Persons with Disability Required</span>
              </label>
            </div>

            {formData.isFarmerOnly && (
              <div className="pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Maximum Landholding Limit (Acres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.maxLandholdingAcres}
                  onChange={(e) => setFormData({ ...formData, maxLandholdingAcres: e.target.value })}
                  placeholder="e.g. 5.0 (leave blank if any landholding is eligible)"
                  className="w-full sm:w-64 px-3 py-1.5 rounded-lg border border-brand-border text-xs text-brand-navy focus:outline-none focus:border-brand-blue bg-white"
                />
              </div>
            )}
          </div>

          {/* Exclusions checklist */}
          <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200/60 space-y-2">
            <span className="text-xs font-bold text-rose-800 block uppercase tracking-wider">
              Exclusion Rules (Ineligible If True)
            </span>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.exclusions?.includes("tax_payer")}
                  onChange={(e) => {
                    const current = formData.exclusions || [];
                    setFormData({
                      ...formData,
                      exclusions: e.target.checked
                        ? [...current, "tax_payer"]
                        : current.filter((x) => x !== "tax_payer"),
                    });
                  }}
                  className="rounded text-rose-600 focus:ring-rose-500/30 w-4 h-4"
                />
                <span>Exclude Income Tax Payers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.exclusions?.includes("govt_employee")}
                  onChange={(e) => {
                    const current = formData.exclusions || [];
                    setFormData({
                      ...formData,
                      exclusions: e.target.checked
                        ? [...current, "govt_employee"]
                        : current.filter((x) => x !== "govt_employee"),
                    });
                  }}
                  className="rounded text-rose-600 focus:ring-rose-500/30 w-4 h-4"
                />
                <span>Exclude Government Employees</span>
              </label>
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
                  className="text-slate-400 hover:text-rose-500 transition"
                  title="Remove document"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {formData.requiredDocuments.length === 0 && (
              <span className="text-xs text-slate-400 italic">No documents specified.</span>
            )}
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
              placeholder="Add another required document (e.g. Caste Certificate, Bank Passbook)"
              className="flex-1 px-3.5 py-2 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
            />
            <button
              type="button"
              onClick={handleAddDocument}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Add Document
            </button>
          </div>
        </div>

        {/* Section 5: Official URLs & Timeline */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">
            5. Official URLs & Application Window
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Official Scheme Portal URL *</span>
                {errors.officialUrl && <span className="text-rose-500 text-[11px] font-medium">{errors.officialUrl}</span>}
              </label>
              <input
                type="url"
                required
                value={formData.officialUrl}
                onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                placeholder="https://pmaymis.gov.in"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-brand-navy focus:outline-none transition ${
                  errors.officialUrl ? "border-rose-400 bg-rose-50/30" : "border-brand-border focus:border-brand-blue"
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Direct Application URL (Optional)</span>
                  {errors.applicationUrl && <span className="text-rose-500 text-[11px] font-medium">{errors.applicationUrl}</span>}
                </label>
                <input
                  type="url"
                  value={formData.applicationUrl}
                  onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                  placeholder="https://pmaymis.gov.in/Open/Find_Beneficiary_Details.aspx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Gazette / Source URL (Optional)</span>
                  {errors.sourceUrl && <span className="text-rose-500 text-[11px] font-medium">{errors.sourceUrl}</span>}
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  placeholder="https://egazette.gov.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            {/* Application Window Status & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Application Window Status</label>
                <select
                  value={formData.applicationStatus || "open"}
                  onChange={(e) => setFormData({ ...formData, applicationStatus: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
                >
                  <option value="open">Open (Accepting Applications)</option>
                  <option value="closing_soon">Closing Soon</option>
                  <option value="closed">Closed (Applications Ceased)</option>
                  <option value="upcoming">Upcoming (Not Yet Open)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Application Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Application End Date / Deadline</label>
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

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <Link
            href="/admin/schemes"
            className="w-full sm:w-auto px-5 py-2.5 text-center bg-white hover:bg-slate-50 border border-brand-border text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition"
          >
            Cancel
          </Link>

          <div className="w-full sm:w-auto flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit("draft")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs sm:text-sm rounded-xl transition disabled:opacity-60"
            >
              <Save className="w-4 h-4 text-amber-600" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit("published")}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Scheme</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-floating border border-brand-border">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                  Live Preview
                </span>
                <h3 className="text-lg font-black text-brand-navy">
                  {formData.name || "Untitled Scheme"}
                </h3>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600 font-medium">
                {formData.shortDescription || "No short summary provided."}
              </p>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block text-xs">Benefits</span>
                  <span className="text-emerald-700 font-black text-sm">
                    {formData.benefits || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-xs">Department</span>
                  <span className="text-slate-800 font-bold text-xs">
                    {formData.department || "Government of India"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-xs">Category & Level</span>
                  <span className="text-slate-700 font-semibold text-xs">
                    {formData.category} • {formData.level}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-xs">Application Window</span>
                  <span className="text-brand-blue font-bold text-xs capitalize">
                    {formData.applicationStatus || "Open"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-700 font-bold block mb-1">Description</span>
                <p className="text-slate-600 whitespace-pre-line text-xs">
                  {formData.description || "No full description provided."}
                </p>
              </div>

              <div>
                <span className="text-slate-700 font-bold block mb-1">Required Documents</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.requiredDocuments.map((d) => (
                    <span key={d} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2 bg-brand-navy text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
