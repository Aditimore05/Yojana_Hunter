"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User as UserIcon, 
  Edit3, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  IndianRupee, 
  Layers, 
  Calendar,
  Save,
  AlertCircle,
  HelpCircle,
  Wheat,
  Building2,
  ShieldCheck,
  Check,
  Sparkles
} from "lucide-react";
import { fetchProfile, updateProfile } from "@/services/profileService";
import { UserProfile } from "@/types/profile";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

const OCCUPATION_OPTIONS = [
  "Student",
  "Farmer",
  "Teacher",
  "Housewife",
  "Employee",
  "Self-employed",
  "Shopkeeper",
  "Salaried Employee",
  "Business Owner",
  "Woman Entrepreneur",
  "Artisan / Craftsperson",
  "Unemployed Person",
  "Homemaker",
  "Other"
];

const STATE_OPTIONS = [
  "All India",
  "Maharashtra",
  "Uttar Pradesh",
  "Karnataka",
  "Delhi",
  "Gujarat",
  "Rajasthan",
  "Madhya Pradesh",
  "Tamil Nadu",
  "West Bengal",
  "Bihar",
  "Punjab",
  "Haryana",
  "Telangana",
  "Andhra Pradesh",
  "Kerala",
  "Odisha",
  "Assam",
  "Other"
];

const EDUCATION_OPTIONS = [
  "10th Pass (Matriculation)",
  "12th Pass (Higher Secondary)",
  "Diploma (Polytechnic)",
  "Graduate (B.A. / B.Com / B.Sc)",
  "Graduate (B.E. / B.Tech / Professional)",
  "Postgraduate (M.A. / M.Sc / M.Tech / MBA)",
  "ITI / Vocational Diploma",
  "8th Pass",
  "Primary School (1st - 5th)",
  "Doctorate / PhD",
  "No Formal Education",
  "Other"
];

const INCOME_BRACKETS = [
  { label: "< ₹1 Lakh per year", value: "< 1 Lakh", numeric: 80000 },
  { label: "₹1 Lakh – ₹2.5 Lakh per year", value: "1 – 2.5 Lakh", numeric: 180000 },
  { label: "₹2.5 Lakh – ₹5 Lakh per year", value: "2.5 – 5 Lakh", numeric: 350000 },
  { label: "₹5 Lakh – ₹8 Lakh per year", value: "5 – 8 Lakh", numeric: 650000 },
  { label: "> ₹8 Lakh per year", value: "> 8 Lakh", numeric: 1000000 },
];

const SOCIAL_CATEGORIES = [
  "General",
  "OBC",
  "SC",
  "ST",
  "EWS"
];

function ProfileContent() {
  const router = useRouter();
  const { user, profile: authProfile, updateProfileState } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    age: 21,
    dateOfBirth: "",
    gender: "Female",
    occupation: "Student",
    annualIncome: "< 1 Lakh",
    incomeNumeric: 95000,
    education: "Graduate (B.E. / B.Tech / Professional)",
    state: "Maharashtra",
    district: "Nashik",
    category: "General",
    fatherName: "",
    completenessPercent: 0,
    language: "en",
    isFarmer: false,
    landHoldingAcres: 0,
    isStudent: true,
    course: "",
    institution: "",
    hasBusiness: false,
    businessType: "",
    isDisabled: false,
    disabilityType: "",
    isTaxPayer: false,
    isGovtEmployee: false,
    employmentStatus: ""
  });

  const [isCustomOccupation, setIsCustomOccupation] = useState(false);
  const [customOccupation, setCustomOccupation] = useState("");
  const [isCustomEducation, setIsCustomEducation] = useState(false);
  const [customEducation, setCustomEducation] = useState("");
  const [isCustomState, setIsCustomState] = useState(false);
  const [customState, setCustomState] = useState("");

  // Load profile from backend on mount
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const p = await fetchProfile();
        if (p) {
          setFormData((prev) => ({
            ...prev,
            ...p,
            name: p.name || user?.email?.split("@")[0] || "",
          }));

          if (p.occupation) {
            const isPredefined = OCCUPATION_OPTIONS.filter(o => o !== "Other").includes(p.occupation);
            if (!isPredefined || p.occupation === "Other") {
              setIsCustomOccupation(true);
              setCustomOccupation(p.occupation === "Other" ? "" : p.occupation);
            } else {
              setIsCustomOccupation(false);
              setCustomOccupation("");
            }
          }

          if (p.education) {
            const isPredefined = EDUCATION_OPTIONS.filter(e => e !== "Other").includes(p.education);
            if (!isPredefined || p.education === "Other") {
              setIsCustomEducation(true);
              setCustomEducation(p.education === "Other" ? "" : p.education);
            } else {
              setIsCustomEducation(false);
              setCustomEducation("");
            }
          }

          if (p.state) {
            const isPredefined = STATE_OPTIONS.filter(s => s !== "Other").includes(p.state);
            if (!isPredefined || p.state === "Other") {
              setIsCustomState(true);
              setCustomState(p.state === "Other" ? "" : p.state);
            } else {
              setIsCustomState(false);
              setCustomState("");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  // Handle Occupation Change and auto-set related helper flags
  const handleOccupationChange = (newOcc: string) => {
    const occLower = newOcc.toLowerCase();
    const isFarmer = occLower.includes("farmer") || occLower.includes("kisan") || occLower.includes("agri");
    const isStudent = occLower.includes("student");
    const isBiz = occLower.includes("business") || occLower.includes("entrepreneur") || occLower.includes("self-employed") || occLower.includes("shopkeeper") || occLower.includes("artisan");
    const isWomanEnt = occLower.includes("woman entrepreneur") || occLower.includes("housewife") || occLower.includes("homemaker");

    setFormData((prev) => ({
      ...prev,
      occupation: newOcc,
      isFarmer,
      isStudent,
      hasBusiness: isBiz,
      gender: isWomanEnt ? "Female" : prev.gender,
      businessType: isWomanEnt && occLower.includes("entrepreneur") ? "Women-led Enterprise" : prev.businessType,
    }));
  };

  // Handle Income Change
  const handleIncomeChange = (bracketValue: string) => {
    const matched = INCOME_BRACKETS.find((b) => b.value === bracketValue);
    setFormData((prev) => ({
      ...prev,
      annualIncome: bracketValue,
      incomeNumeric: matched ? matched.numeric : prev.incomeNumeric,
    }));
  };

  // Form Validation & Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    // Validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const finalOccupation = isCustomOccupation ? customOccupation.trim() : formData.occupation.trim();
    if (!finalOccupation || finalOccupation === "Other") {
      setErrorMessage("Please select or enter your actual occupation.");
      return;
    }

    const finalEducation = isCustomEducation ? customEducation.trim() : (formData.education || "").trim();
    if (isCustomEducation && (!finalEducation || finalEducation === "Other")) {
      setErrorMessage("Please enter your actual qualification.");
      return;
    }

    const finalState = isCustomState ? customState.trim() : formData.state.trim();
    if (!finalState || finalState === "Other") {
      setErrorMessage("Please select or enter your state of residence.");
      return;
    }

    if (!formData.age || formData.age < 1 || formData.age > 120) {
      setErrorMessage("Please enter a valid age between 1 and 120.");
      return;
    }

    setSaving(true);
    try {
      const occLower = finalOccupation.toLowerCase();
      const isStudentOcc = occLower.includes("student");
      const isFarmerOcc = occLower.includes("farmer") || occLower.includes("kisan") || occLower.includes("agri") || occLower.includes("cultivat");
      const isBizOcc = occLower.includes("business") || occLower.includes("entrepreneur") || occLower.includes("self-employed") || occLower.includes("shopkeeper") || occLower.includes("artisan") || occLower.includes("trader");
      const isWomanEnt = occLower.includes("woman entrepreneur") || occLower.includes("housewife") || occLower.includes("homemaker");

      let resolvedIsFarmer = isFarmerOcc;
      let resolvedIsStudent = isStudentOcc;
      let resolvedHasBiz = isBizOcc || Boolean(formData.hasBusiness);

      if (!isStudentOcc && !isFarmerOcc) {
        resolvedIsStudent = false;
        const land = Number(formData.landHoldingAcres || 0);
        resolvedIsFarmer = Boolean(formData.isFarmer && land > 0);
      }

      const payload: Partial<UserProfile> = {
        ...formData,
        name: trimmedName,
        occupation: finalOccupation,
        education: finalEducation || formData.education,
        state: finalState,
        isFarmer: resolvedIsFarmer,
        isStudent: resolvedIsStudent,
        hasBusiness: resolvedHasBiz,
        gender: isWomanEnt && (!formData.gender || formData.gender === "Female") ? "Female" : formData.gender,
      };

      const updated = await updateProfile(payload);
      setFormData(updated);
      updateProfileState(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save profile. Please check your network connection.");
    } finally {
      setSaving(false);
    }
  };

  const selectedOcc = formData.occupation.toLowerCase();
  const isFarmerSelected = selectedOcc.includes("farmer");
  const isStudentSelected = selectedOcc.includes("student");
  const isBusinessSelected = selectedOcc.includes("business") || selectedOcc.includes("entrepreneur") || selectedOcc.includes("self-employed") || selectedOcc.includes("artisan");
  const isSalariedSelected = selectedOcc.includes("salaried") || selectedOcc.includes("employee");
  const isUnemployedSelected = selectedOcc.includes("unemployed");

  if (loading) {
    return (
      <main className="flex-1 bg-brand-bg py-12 px-4 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading citizen profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Citizen Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
              Manage Your Profile & Eligibility Criteria
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Your details are evaluated directly by the scheme matching rule engine to find all benefits you qualify for.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/schemes"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
            >
              <span>View Matching Schemes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Notifications / Alerts */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Profile updated successfully! Scheme recommendations have been recalculated based on your new data.</span>
            </div>
            <Link
              href="/schemes"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shrink-0"
            >
              See Schemes →
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2 font-semibold shadow-xs animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Form Card */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-brand-border shadow-card p-6 sm:p-8 space-y-8">
          
          {/* SECTION 1: PERSONAL & DEMOGRAPHIC DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserIcon className="w-5 h-5 text-brand-blue" />
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
                1. Personal & Demographic Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aditi More"
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gender
                </label>
                <select
                  value={formData.gender || "All"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Age (Years) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={formData.age || ""}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 21"
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Date of Birth (Optional)
                </label>
                <input
                  type="text"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  placeholder="DD-MM-YYYY or YYYY-MM-DD"
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>

              {/* State of Residence */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  State of Residence <span className="text-rose-500">*</span>
                </label>
                <select
                  value={isCustomState ? "Other" : (STATE_OPTIONS.includes(formData.state) ? formData.state : "Other")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setIsCustomState(true);
                      setCustomState("");
                      setFormData({ ...formData, state: "" });
                    } else {
                      setIsCustomState(false);
                      setCustomState("");
                      setFormData({ ...formData, state: val });
                    }
                  }}
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                >
                  {STATE_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {isCustomState && (
                  <input
                    type="text"
                    value={customState}
                    onChange={(e) => {
                      setCustomState(e.target.value);
                      setFormData({ ...formData, state: e.target.value });
                    }}
                    placeholder="Enter your state name"
                    className="w-full mt-2 text-xs sm:text-sm p-2.5 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  District / City
                </label>
                <input
                  type="text"
                  value={formData.district || ""}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Nashik, Varanasi, Pune"
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>

              {/* Social Category / Caste */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Social Category (Caste Group)
                </label>
                <select
                  value={formData.category || "General"}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                >
                  {SOCIAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Father / Guardian Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Father&apos;s / Guardian&apos;s Name
                </label>
                <input
                  type="text"
                  value={formData.fatherName || ""}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="e.g. Santosh More"
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: OCCUPATION, EDUCATION & INCOME */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Briefcase className="w-5 h-5 text-brand-blue" />
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
                2. Occupation, Education & Income
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Occupation Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Primary Occupation <span className="text-rose-500">*</span>
                </label>
                <select
                  value={isCustomOccupation ? "Other" : (OCCUPATION_OPTIONS.includes(formData.occupation) ? formData.occupation : "Other")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setIsCustomOccupation(true);
                      setCustomOccupation("");
                      handleOccupationChange("");
                    } else {
                      setIsCustomOccupation(false);
                      setCustomOccupation("");
                      handleOccupationChange(val);
                    }
                  }}
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white font-semibold"
                >
                  {OCCUPATION_OPTIONS.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
                {isCustomOccupation && (
                  <input
                    type="text"
                    value={customOccupation}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomOccupation(val);
                      handleOccupationChange(val);
                    }}
                    placeholder="Enter your occupation (e.g. Teacher, Housewife, Shopkeeper)"
                    className="w-full mt-2 text-xs sm:text-sm p-2.5 border border-brand-blue rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-blue-50/20"
                    autoFocus
                  />
                )}
                <span className="text-2xs text-slate-500 mt-1 block">
                  Selecting your occupation unlocks specific relevant welfare schemes.
                </span>
              </div>

              {/* Education Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Educational Qualification
                </label>
                <select
                  value={isCustomEducation ? "Other" : (EDUCATION_OPTIONS.includes(formData.education) ? formData.education : "Other")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setIsCustomEducation(true);
                      setCustomEducation("");
                      setFormData({ ...formData, education: "" });
                    } else {
                      setIsCustomEducation(false);
                      setCustomEducation("");
                      setFormData({ ...formData, education: val });
                    }
                  }}
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                >
                  {EDUCATION_OPTIONS.map((edu) => (
                    <option key={edu} value={edu}>{edu}</option>
                  ))}
                </select>
                {isCustomEducation && (
                  <input
                    type="text"
                    value={customEducation}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomEducation(val);
                      setFormData({ ...formData, education: val });
                    }}
                    placeholder="Enter your qualification (e.g. B.Ed, M.Phil, High School)"
                    className="w-full mt-2 text-xs sm:text-sm p-2.5 border border-brand-blue rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-blue-50/20"
                    autoFocus
                  />
                )}
              </div>

              {/* Annual Family Income */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Annual Family Income
                </label>
                <select
                  value={formData.annualIncome || "< 1 Lakh"}
                  onChange={(e) => handleIncomeChange(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                >
                  {INCOME_BRACKETS.map((inc) => (
                    <option key={inc.value} value={inc.value}>{inc.label}</option>
                  ))}
                </select>
                <span className="text-2xs text-slate-500 mt-1 block">
                  Many schemes have income ceilings (e.g. ≤ ₹2.5 Lakh for scholarships, ≤ ₹8 Lakh for loans).
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: CONDITIONAL DYNAMIC FIELDS (BASED ON OCCUPATION) */}
          <div className="space-y-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-200">
            <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
              <Sparkles className="w-5 h-5 text-brand-blue" />
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
                3. Dynamic Details for {formData.occupation || "Selected Occupation"}
              </h2>
            </div>

            {/* DYNAMIC CASE: FARMER */}
            {isFarmerSelected && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Farmer Scheme Requirements:</strong> Land holding acreage is required to verify eligibility for PM-KISAN, PM-KMY, and state subsidies.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Agricultural Land Holding (Acres) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={formData.landHoldingAcres || ""}
                      onChange={(e) => setFormData({ ...formData, landHoldingAcres: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g. 2.5 acres"
                      className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                    />
                    <span className="text-2xs text-slate-500 mt-1 block">
                      Small/Marginal Farmers have ≤ 5 acres (2 hectares).
                    </span>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isFarmer)}
                        onChange={(e) => setFormData({ ...formData, isFarmer: e.target.checked })}
                        className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue"
                      />
                      <span>Active Cultivator / Landowner Status Verified</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC CASE: STUDENT */}
            {isStudentSelected && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-brand-blue shrink-0" />
                  <span>
                    <strong>Student Scheme Requirements:</strong> Course and institution details help match PM Vidyalakshmi, Post Matric Scholarships, and Apprenticeships.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Currently Enrolled Course / Degree
                    </label>
                    <input
                      type="text"
                      value={formData.course || ""}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      placeholder="e.g. B.E. Computer Engineering (Final Year)"
                      className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      College / University / School Name
                    </label>
                    <input
                      type="text"
                      value={formData.institution || ""}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="e.g. Govt Engineering College"
                      className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC CASE: BUSINESS OWNER / WOMAN ENTREPRENEUR / SELF-EMPLOYED */}
            {isBusinessSelected && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-white rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    <strong>Enterprise Scheme Requirements:</strong> Business type unlocks Stand-Up India, PM Vishwakarma, and MSME loan schemes.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Enterprise / Trade Category
                    </label>
                    <input
                      type="text"
                      value={formData.businessType || ""}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      placeholder="e.g. Traditional Artisan Craft, Retail Shop, Food Processing"
                      className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.hasBusiness)}
                        onChange={(e) => setFormData({ ...formData, hasBusiness: e.target.checked })}
                        className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue"
                      />
                      <span>Operates Small Business / Micro Enterprise / Craft</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC CASE: SALARIED EMPLOYEE */}
            {isSalariedSelected && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Employment Sector / Nature
                    </label>
                    <select
                      value={formData.employmentStatus || "Private Sector"}
                      onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                      className="w-full text-xs sm:text-sm p-3 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                    >
                      <option value="Private Sector">Private Sector</option>
                      <option value="Government Employee">Government (Central/State)</option>
                      <option value="Contractual / Gig Worker">Contractual / Gig Worker</option>
                      <option value="Public Sector Unit">PSU / Semi-Govt</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC CASE: UNEMPLOYED */}
            {isUnemployedSelected && (
              <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-blue shrink-0" />
                <span>
                  As a job seeker, you will be matched with skill development programs (Skill India), apprenticeship stipends (NAPS), and PM Internship schemes.
                </span>
              </div>
            )}

            {/* If other or not matching primary categories */}
            {!isFarmerSelected && !isStudentSelected && !isBusinessSelected && !isSalariedSelected && !isUnemployedSelected && (
              <p className="text-xs text-slate-600">
                General welfare schemes (e.g. healthcare, housing, and social security) will be matched based on your income and state domicile.
              </p>
            )}
          </div>

          {/* SECTION 4: EXCLUSIONS & SPECIAL ELIGIBILITY FACTORS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-brand-blue" />
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
                4. Mandatory Exclusions & Special Entitlement Criteria
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Official government guidelines explicitly exclude income tax payers and government officials from welfare pensions and subsidies. Please verify:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Income Tax Payer */}
              <div className="p-4 rounded-xl border border-brand-border bg-slate-50 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isTaxPayer)}
                    onChange={(e) => setFormData({ ...formData, isTaxPayer: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-brand-blue rounded focus:ring-brand-blue"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      Income Tax Payer
                    </span>
                    <span className="text-2xs text-slate-500">
                      Check if you or your spouse filed an Income Tax Return (ITR) in the last assessment year.
                    </span>
                  </div>
                </label>
              </div>

              {/* Govt Employee */}
              <div className="p-4 rounded-xl border border-brand-border bg-slate-50 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isGovtEmployee)}
                    onChange={(e) => setFormData({ ...formData, isGovtEmployee: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-brand-blue rounded focus:ring-brand-blue"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      Government Employee
                    </span>
                    <span className="text-2xs text-slate-500">
                      Check if you are a regular/permanent employee of Central or State government.
                    </span>
                  </div>
                </label>
              </div>

              {/* Person with Disability (Divyangjan) */}
              <div className="p-4 rounded-xl border border-brand-border bg-slate-50 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isDisabled)}
                    onChange={(e) => setFormData({ ...formData, isDisabled: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-brand-blue rounded focus:ring-brand-blue"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      Person with Disability (Divyangjan)
                    </span>
                    <span className="text-2xs text-slate-500">
                      Check if you hold a UDID card or certificate of benchmark disability (≥ 40%).
                    </span>
                  </div>
                </label>

                {formData.isDisabled && (
                  <input
                    type="text"
                    value={formData.disabilityType || ""}
                    onChange={(e) => setFormData({ ...formData, disabilityType: e.target.value })}
                    placeholder="Disability type (e.g. Locomotor, Visual)"
                    className="w-full text-2xs p-2 border border-brand-border rounded-lg bg-white mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Changes are saved to your secure profile and immediately update your matched schemes list.
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-blue-500/25 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Profile..." : "Save Profile Details"}</span>
              </button>

              <Link
                href="/schemes"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-brand-navy border border-brand-border font-bold text-sm rounded-xl shadow-xs transition"
              >
                <span>Find Schemes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </form>

      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
