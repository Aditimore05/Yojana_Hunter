"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  RotateCcw, 
  User, 
  Briefcase, 
  ShieldAlert, 
  Wheat, 
  GraduationCap, 
  Store, 
  Loader2,
  ChevronRight,
  Layers
} from "lucide-react";
import { fetchProfile } from "@/services/profileService";
import { matchSchemesWithProfile } from "@/services/schemeService";
import { SchemeCard } from "@/components/schemes/SchemeCard";
import { Scheme, EligibilityStatus } from "@/types/scheme";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function InteractiveSchemeMatcherContent() {
  // Questionnaire state
  const [age, setAge] = useState<string>("24");
  const [gender, setGender] = useState<string>("Male");
  const [socialCategory, setSocialCategory] = useState<string>("General");
  const [state, setState] = useState<string>("Maharashtra");
  const [district, setDistrict] = useState<string>("");
  const [annualIncome, setAnnualIncome] = useState<string>("250000");
  const [occupation, setOccupation] = useState<string>("Student");
  const [isCustomOccupation, setIsCustomOccupation] = useState<boolean>(false);
  const [customOccupation, setCustomOccupation] = useState<string>("");
  const [education, setEducation] = useState<string>("Graduate");
  const [isCustomEducation, setIsCustomEducation] = useState<boolean>(false);
  const [customEducation, setCustomEducation] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Specific criteria
  const [isFarmer, setIsFarmer] = useState<boolean>(false);
  const [landholdingAcres, setLandholdingAcres] = useState<string>("");
  const [isStudent, setIsStudent] = useState<boolean>(true);
  const [course, setCourse] = useState<string>("B.Tech Computer Science");
  const [hasBusiness, setHasBusiness] = useState<boolean>(false);
  const [businessType, setBusinessType] = useState<string>("");
  const [hasDisability, setHasDisability] = useState<boolean>(false);

  // Exclusions
  const [isTaxPayer, setIsTaxPayer] = useState<boolean>(false);
  const [isGovtEmployee, setIsGovtEmployee] = useState<boolean>(false);

  // Results state
  const [loading, setLoading] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    eligible: 0,
    possibly_eligible: 0,
    not_eligible: 0,
    applications_closed: 0,
  });
  const [activeTab, setActiveTab] = useState<EligibilityStatus | "all">("eligible");

  const PREDEFINED_MATCH_OCCS = ["Student", "Farmer", "Teacher", "Housewife", "Employee", "Self-employed", "Shopkeeper", "Salaried", "Unemployed", "Homemaker"];
  const PREDEFINED_MATCH_EDUS = ["10th Pass", "12th Pass", "Diploma", "Graduate", "Post Graduate", "Below 10th"];

  // Load existing profile if available
  useEffect(() => {
    async function loadInitialProfile() {
      try {
        const profile = await fetchProfile();
        if (profile) {
          if (profile.age) setAge(String(profile.age));
          if (profile.gender) setGender(profile.gender);
          if (profile.socialCategory || profile.category) setSocialCategory(profile.socialCategory || profile.category);
          if (profile.state) setState(profile.state);
          if (profile.district) setDistrict(profile.district);
          if (profile.annualIncome) setAnnualIncome(String(profile.annualIncome));
          if (profile.occupation) {
            if (!PREDEFINED_MATCH_OCCS.includes(profile.occupation) || profile.occupation === "Other") {
              setIsCustomOccupation(true);
              setCustomOccupation(profile.occupation === "Other" ? "" : profile.occupation);
              setOccupation("Other");
            } else {
              setOccupation(profile.occupation);
              setIsCustomOccupation(false);
            }
          }
          if (profile.education) {
            if (!PREDEFINED_MATCH_EDUS.includes(profile.education) || profile.education === "Other") {
              setIsCustomEducation(true);
              setCustomEducation(profile.education === "Other" ? "" : profile.education);
              setEducation("Other");
            } else {
              setEducation(profile.education);
              setIsCustomEducation(false);
            }
          }
          if (profile.isFarmer !== undefined) setIsFarmer(profile.isFarmer);
          if (profile.landHoldingAcres !== undefined || profile.landholdingAcres !== undefined) {
            setLandholdingAcres(String(profile.landHoldingAcres || profile.landholdingAcres));
          }
          if (profile.isStudent !== undefined) setIsStudent(profile.isStudent);
          if (profile.course) setCourse(profile.course);
          if (profile.hasBusiness !== undefined) setHasBusiness(profile.hasBusiness);
          if (profile.businessType) setBusinessType(profile.businessType);
          if (profile.disabilityType || profile.isDisabled || profile.hasDisability) setHasDisability(true);
          if (profile.isTaxPayer !== undefined) setIsTaxPayer(profile.isTaxPayer);
          if (profile.isGovtEmployee !== undefined) setIsGovtEmployee(profile.isGovtEmployee);
        }
      } catch {
        // Fall back to clean defaults
      }
    }
    loadInitialProfile();
  }, []);

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    const finalOccupation = isCustomOccupation ? customOccupation.trim() : occupation;
    if (isCustomOccupation && (!finalOccupation || finalOccupation === "Other")) {
      setValidationError("Please enter your actual occupation.");
      return;
    }

    const finalEducation = isCustomEducation ? customEducation.trim() : education;
    if (isCustomEducation && (!finalEducation || finalEducation === "Other")) {
      setValidationError("Please enter your actual qualification.");
      return;
    }

    setLoading(true);

    const occLower = finalOccupation.toLowerCase();
    const isStudentOcc = occLower.includes("student");
    const isFarmerOcc = occLower.includes("farmer") || occLower.includes("kisan") || occLower.includes("agri") || occLower.includes("cultivat");
    const isBizOcc = occLower.includes("business") || occLower.includes("entrepreneur") || occLower.includes("self-employed") || occLower.includes("shopkeeper") || occLower.includes("artisan") || occLower.includes("trader");

    let effectiveIsFarmer = isFarmerOcc;
    let effectiveIsStudent = isStudentOcc;
    let effectiveHasBiz = isBizOcc || hasBusiness;

    if (!isStudentOcc && !isFarmerOcc) {
      effectiveIsStudent = false;
      const land = landholdingAcres ? parseFloat(landholdingAcres) : 0;
      effectiveIsFarmer = Boolean(isFarmer && land > 0);
    }

    const payload = {
      age: age ? parseInt(age, 10) : null,
      gender,
      socialCategory,
      state,
      district,
      annualIncome: annualIncome ? parseFloat(annualIncome) : null,
      occupation: finalOccupation,
      education: finalEducation,
      isFarmer: effectiveIsFarmer,
      landholdingAcres: landholdingAcres ? parseFloat(landholdingAcres) : null,
      isStudent: effectiveIsStudent,
      course,
      hasBusiness: effectiveHasBiz,
      businessType,
      hasDisability,
      disabilityType: hasDisability ? "Locomotor Disability" : null,
      isTaxPayer,
      isGovtEmployee,
    };

    try {
      const result = await matchSchemesWithProfile(payload);
      setSchemes(result.schemes || []);
      setCounts({
        total: result.total_evaluated || (result.schemes || []).length,
        eligible: result.eligible_count || 0,
        possibly_eligible: result.possibly_eligible_count || 0,
        not_eligible: result.not_eligible_count || 0,
        applications_closed: result.applications_closed_count || 0,
      });
      setEvaluated(true);

      // Auto-focus the best tab
      if (result.eligible_count > 0) {
        setActiveTab("eligible");
      } else if (result.possibly_eligible_count > 0) {
        setActiveTab("possibly_eligible");
      } else {
        setActiveTab("all");
      }

      // Smooth scroll to results
      const resEl = document.getElementById("matching-results-section");
      if (resEl) {
        resEl.scrollIntoView({ behavior: "smooth" });
      }
    } finally {
      setLoading(false);
    }
  };

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

  const filteredSchemes = schemes.filter((s) => {
    if (activeTab === "all") return true;
    return s.eligibilityStatus === activeTab || (s as any).legacyEligibilityStatus === activeTab;
  });

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Navigation Breadcrumb & Title */}
        <div className="space-y-3">
          <Link
            href="/schemes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-blue transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Schemes</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-brand-blue border border-blue-200 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deterministic Eligibility Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
                Smart Scheme Eligibility Matcher
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your profile attributes to evaluate 100% verified government schemes with satisfied vs missing breakdowns.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Questionnaire Form */}
        <form onSubmit={handleEvaluate} className="bg-white rounded-2xl border border-brand-border shadow-card p-6 sm:p-8 space-y-6">
          {/* Section 1: Demographics */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-brand-blue" />
              <span>1. Personal & Residence Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Age</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Social Category</label>
                <select
                  value={socialCategory}
                  onChange={(e) => setSocialCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="Minority">Minority</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">State of Residence</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
                >
                  {states.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial & Occupation */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Briefcase className="w-4 h-4 text-brand-blue" />
              <span>2. Economic & Educational Status</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Annual Family Income (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder="e.g. 250000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Primary Occupation</label>
                <select
                  value={isCustomOccupation ? "Other" : occupation}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setIsCustomOccupation(true);
                      setCustomOccupation("");
                    } else {
                      setIsCustomOccupation(false);
                      setCustomOccupation("");
                      setOccupation(val);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
                >
                  <option value="Student">Student</option>
                  <option value="Farmer">Farmer / Agriculture</option>
                  <option value="Teacher">Teacher / Academic</option>
                  <option value="Housewife">Housewife / Homemaker</option>
                  <option value="Employee">Employee</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Shopkeeper">Shopkeeper / Retailer</option>
                  <option value="Salaried">Salaried Employee</option>
                  <option value="Unemployed">Unemployed / Job Seeker</option>
                  <option value="Other">Other</option>
                </select>
                {isCustomOccupation && (
                  <input
                    type="text"
                    value={customOccupation}
                    onChange={(e) => {
                      setCustomOccupation(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Enter your occupation (e.g. Teacher, Housewife, Shopkeeper)"
                    className="w-full mt-1.5 px-3 py-2 rounded-lg border border-brand-blue text-xs sm:text-sm bg-blue-50/20 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    autoFocus
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Education Qualification</label>
                <select
                  value={isCustomEducation ? "Other" : education}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setIsCustomEducation(true);
                      setCustomEducation("");
                    } else {
                      setIsCustomEducation(false);
                      setCustomEducation("");
                      setEducation(val);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-white focus:outline-none focus:border-brand-blue"
                >
                  <option value="10th Pass">10th Pass</option>
                  <option value="12th Pass">12th Pass</option>
                  <option value="Diploma">Diploma / Polytechnic</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                  <option value="Below 10th">Below 10th</option>
                  <option value="Other">Other</option>
                </select>
                {isCustomEducation && (
                  <input
                    type="text"
                    value={customEducation}
                    onChange={(e) => {
                      setCustomEducation(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Enter qualification (e.g. B.Ed, M.Phil, High School)"
                    className="w-full mt-1.5 px-3 py-2 rounded-lg border border-brand-blue text-xs sm:text-sm bg-blue-50/20 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Specialized Criteria Checkboxes */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-brand-navy uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Wheat className="w-4 h-4 text-emerald-600" />
              <span>3. Specialized Attributes</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Farmer Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-brand-navy">
                  <input
                    type="checkbox"
                    checked={isFarmer}
                    onChange={(e) => setIsFarmer(e.target.checked)}
                    className="rounded text-brand-blue focus:ring-brand-blue/30 w-4 h-4"
                  />
                  <span>I am a practicing farmer</span>
                </label>
                {isFarmer && (
                  <div className="pt-2">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Agricultural Landholding (in Acres)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={landholdingAcres}
                      onChange={(e) => setLandholdingAcres(e.target.value)}
                      placeholder="e.g. 2.5"
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-border text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Student Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-brand-navy">
                  <input
                    type="checkbox"
                    checked={isStudent}
                    onChange={(e) => setIsStudent(e.target.checked)}
                    className="rounded text-brand-blue focus:ring-brand-blue/30 w-4 h-4"
                  />
                  <span>Currently enrolled as a student</span>
                </label>
                {isStudent && (
                  <div className="pt-2">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Course / Degree
                    </label>
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. B.Tech Computer Science"
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-border text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Business Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-brand-navy">
                  <input
                    type="checkbox"
                    checked={hasBusiness}
                    onChange={(e) => setHasBusiness(e.target.checked)}
                    className="rounded text-brand-blue focus:ring-brand-blue/30 w-4 h-4"
                  />
                  <span>I own an MSME or registered business</span>
                </label>
                {hasBusiness && (
                  <div className="pt-2">
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Business Type / Industry
                    </label>
                    <input
                      type="text"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="e.g. Retail / Manufacturing"
                      className="w-full px-3 py-1.5 rounded-lg border border-brand-border text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Disability Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-brand-navy">
                  <input
                    type="checkbox"
                    checked={hasDisability}
                    onChange={(e) => setHasDisability(e.target.checked)}
                    className="rounded text-brand-blue focus:ring-brand-blue/30 w-4 h-4"
                  />
                  <span>Person with Disability (Divyangjan - ≥ 40%)</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Qualifies for specialized accessibility and financial grants.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Exclusion Checks */}
          <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200/60 space-y-2">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Statutory Exclusion Questions</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isTaxPayer}
                  onChange={(e) => setIsTaxPayer(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500/30 w-4 h-4"
                />
                <span>I paid Income Tax in the previous assessment year</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isGovtEmployee}
                  onChange={(e) => setIsGovtEmployee(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500/30 w-4 h-4"
                />
                <span>I or a family member is a Government Employee</span>
              </label>
            </div>
          </div>

          {/* Submit Evaluate Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-brand-blue to-teal-600 hover:from-brand-blue-dark hover:to-teal-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Database Schemes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluate My Eligibility Now</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {evaluated && (
          <div id="matching-results-section" className="space-y-6 pt-4 animate-fadeIn">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Eligible Schemes</span>
                <span className="text-3xl font-black text-emerald-700 block mt-1">{counts.eligible}</span>
                <span className="text-[11px] text-emerald-600 mt-0.5 block">100% verified match</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Possibly Eligible</span>
                <span className="text-3xl font-black text-amber-700 block mt-1">{counts.possibly_eligible}</span>
                <span className="text-[11px] text-amber-600 mt-0.5 block">Pending info / documents</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 shadow-2xs">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">Closed Window</span>
                <span className="text-3xl font-black text-purple-700 block mt-1">{counts.applications_closed}</span>
                <span className="text-[11px] text-purple-600 mt-0.5 block">Applications ceased</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Total Evaluated</span>
                <span className="text-3xl font-black text-slate-800 block mt-1">{counts.total}</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Published live schemes</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab("eligible")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  activeTab === "eligible"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                Eligible ({counts.eligible})
              </button>
              <button
                onClick={() => setActiveTab("possibly_eligible")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  activeTab === "possibly_eligible"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"
                }`}
              >
                Possibly Eligible ({counts.possibly_eligible})
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-brand-border"
                }`}
              >
                All Schemes ({schemes.length})
              </button>
              <button
                onClick={() => setActiveTab("applications_closed")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  activeTab === "applications_closed"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white text-purple-700 hover:bg-purple-50 border border-purple-200"
                }`}
              >
                Closed ({counts.applications_closed})
              </button>
              <button
                onClick={() => setActiveTab("not_eligible")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  activeTab === "not_eligible"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-brand-border"
                }`}
              >
                Not Eligible ({counts.not_eligible})
              </button>
            </div>

            {/* Scheme Cards */}
            <div className="space-y-4">
              {filteredSchemes.length > 0 ? (
                filteredSchemes.map((scheme) => (
                  <SchemeCard key={scheme.id} scheme={scheme} />
                ))
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-brand-border space-y-2">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-bold text-sm">
                    No schemes in &ldquo;{activeTab.replace(/_/g, " ")}&rdquo; category.
                  </p>
                  <button
                    onClick={() => setActiveTab("all")}
                    className="text-xs text-brand-blue font-bold hover:underline"
                  >
                    View all evaluated schemes
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function InteractiveSchemeMatcherPage() {
  return (
    <ProtectedRoute>
      <InteractiveSchemeMatcherContent />
    </ProtectedRoute>
  );
}
