"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  User, 
  Users, 
  Heart, 
  Sparkles, 
  Check, 
  Save, 
  ArrowRight, 
  Baby, 
  Briefcase, 
  MapPin, 
  GraduationCap, 
  IndianRupee,
  Layers,
  Calendar,
  AlertCircle
} from "lucide-react";
import { UserProfile, FamilyRelationship } from "@/types/profile";
import { createProfile, updateProfile } from "@/services/profileService";
import { useAuth } from "@/context/AuthContext";

interface FamilyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved: (profile: UserProfile) => void;
  editProfile?: UserProfile | null;
}

const RELATIONSHIP_OPTIONS: { label: string; value: FamilyRelationship; icon: string; desc: string }[] = [
  { label: "Father", value: "Father", icon: "👨", desc: "Dad / Senior citizen / Farmer / Retired" },
  { label: "Mother", value: "Mother", icon: "👩", desc: "Mom / Homemaker / Senior / Healthcare" },
  { label: "Child", value: "Child", icon: "🧒", desc: "Son or Daughter / Student / Youth" },
  { label: "Spouse", value: "Spouse", icon: "💍", desc: "Husband / Wife / Co-applicant" },
  { label: "Other", value: "Other", icon: "🤝", desc: "Sibling, Grandparent, Dependent relative" },
];

const OCCUPATION_OPTIONS = [
  "Student",
  "Farmer",
  "Teacher",
  "Housewife / Homemaker",
  "Salaried Employee",
  "Self-employed / Business Owner",
  "Shopkeeper",
  "Artisan / Craftsperson",
  "Woman Entrepreneur",
  "Unemployed Person",
  "Retired / Senior Citizen",
  "Other"
];

const STATE_OPTIONS = [
  "Maharashtra",
  "Uttar Pradesh",
  "Karnataka",
  "Delhi",
  "Gujarat",
  "Rajasthan",
  "Madhya Pradesh",
  "Bihar",
  "Punjab",
  "Haryana",
  "Tamil Nadu",
  "West Bengal",
  "Telangana",
  "Andhra Pradesh",
  "Kerala",
  "All India"
];

const INCOME_BRACKETS = [
  { label: "< ₹1 Lakh per year", value: "< 1 Lakh", numeric: 80000 },
  { label: "₹1 Lakh – ₹2.5 Lakh per year", value: "1 – 2.5 Lakh", numeric: 180000 },
  { label: "₹2.5 Lakh – ₹5 Lakh per year", value: "2.5 – 5 Lakh", numeric: 350000 },
  { label: "₹5 Lakh – ₹8 Lakh per year", value: "5 – 8 Lakh", numeric: 650000 },
  { label: "> ₹8 Lakh per year", value: "> 8 Lakh", numeric: 1000000 },
];

const EDUCATION_OPTIONS = [
  "No Formal Education",
  "Primary School (1st - 5th)",
  "8th Pass",
  "10th Pass (Matriculation)",
  "12th Pass (Higher Secondary)",
  "Diploma (Polytechnic / Vocational)",
  "Graduate (B.A. / B.Com / B.Sc)",
  "Graduate (B.E. / B.Tech / Professional)",
  "Postgraduate (M.A. / M.Sc / M.Tech / MBA)",
  "Doctorate / PhD",
  "Other"
];

export function FamilyProfileModal({
  isOpen,
  onClose,
  onProfileSaved,
  editProfile,
}: FamilyProfileModalProps) {
  const { switchActiveProfile, refreshFamilyProfiles } = useAuth();

  // Step 1: "Self" vs "Relative" selection (only if not editing an existing profile)
  const [targetType, setTargetType] = useState<"self" | "relative">("relative");
  const [step, setStep] = useState<1 | 2>(editProfile ? 2 : 1);
  const [selectedRelationship, setSelectedRelationship] = useState<FamilyRelationship>("Father");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    occupation: "Farmer",
    state: "Maharashtra",
    district: "",
    annualIncome: "< 1 Lakh",
    incomeNumeric: 80000,
    education: "10th Pass (Matriculation)",
    category: "General",
    landHoldingAcres: "2.0",
    dateOfBirth: "",
    fatherName: "",
    isDisabled: false,
  });

  useEffect(() => {
    if (editProfile) {
      setStep(2);
      const isSelf = editProfile.relationship === "Self";
      setTargetType(isSelf ? "self" : "relative");
      setSelectedRelationship((editProfile.relationship as FamilyRelationship) || "Father");
      setFormData({
        name: editProfile.name || editProfile.fullName || "",
        age: editProfile.age ? String(editProfile.age) : "",
        gender: editProfile.gender || "Male",
        occupation: editProfile.occupation || "Farmer",
        state: editProfile.state || "Maharashtra",
        district: editProfile.district || "",
        annualIncome: editProfile.annualIncome || "< 1 Lakh",
        incomeNumeric: editProfile.incomeNumeric || 80000,
        education: editProfile.education || "10th Pass (Matriculation)",
        category: editProfile.category || "General",
        landHoldingAcres: String(editProfile.landHoldingAcres ?? 0),
        dateOfBirth: editProfile.dateOfBirth || "",
        fatherName: editProfile.fatherName || "",
        isDisabled: Boolean(editProfile.isDisabled),
      });
    } else {
      setStep(1);
      setTargetType("relative");
      setSelectedRelationship("Father");
      setFormData({
        name: "",
        age: "",
        gender: "Male",
        occupation: "Farmer",
        state: "Maharashtra",
        district: "",
        annualIncome: "< 1 Lakh",
        incomeNumeric: 80000,
        education: "10th Pass (Matriculation)",
        category: "General",
        landHoldingAcres: "2.0",
        dateOfBirth: "",
        fatherName: "",
        isDisabled: false,
      });
    }
    setError(null);
  }, [editProfile, isOpen]);

  // Adjust defaults when relationship changes
  const handleSelectRelationship = (rel: FamilyRelationship) => {
    setSelectedRelationship(rel);
    if (rel === "Father") {
      setFormData(prev => ({
        ...prev,
        gender: "Male",
        occupation: prev.occupation || "Farmer",
        age: prev.age || "60"
      }));
    } else if (rel === "Mother") {
      setFormData(prev => ({
        ...prev,
        gender: "Female",
        occupation: prev.occupation || "Housewife / Homemaker",
        age: prev.age || "55"
      }));
    } else if (rel === "Child") {
      setFormData(prev => ({
        ...prev,
        occupation: "Student",
        age: prev.age || "18"
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError("Please enter the person's full name.");
      return;
    }

    const parsedAge = parseInt(formData.age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      setError("Please enter a valid age between 1 and 120.");
      return;
    }

    setSaving(true);
    try {
      const finalRelationship = targetType === "self" ? "Self" : selectedRelationship;
      const occLower = formData.occupation.toLowerCase();
      const isFarmer = occLower.includes("farmer") || occLower.includes("kisan") || occLower.includes("agri");
      const isStudent = occLower.includes("student");
      const hasBusiness = occLower.includes("business") || occLower.includes("shop") || occLower.includes("self-employed") || occLower.includes("entrepreneur");

      const payload: Partial<UserProfile> = {
        relationship: finalRelationship,
        name: trimmedName,
        fullName: trimmedName,
        age: parsedAge,
        gender: formData.gender,
        occupation: formData.occupation,
        state: formData.state,
        district: formData.district,
        annualIncome: formData.annualIncome,
        incomeNumeric: formData.incomeNumeric,
        education: formData.education,
        category: formData.category,
        dateOfBirth: formData.dateOfBirth,
        fatherName: formData.fatherName,
        isFarmer,
        isStudent,
        hasBusiness,
        landHoldingAcres: isFarmer ? (parseFloat(formData.landHoldingAcres) || 0) : 0,
        isDisabled: formData.isDisabled,
      };

      let saved: UserProfile;
      if (editProfile && editProfile.id) {
        saved = await updateProfile(payload, editProfile.id);
      } else {
        saved = await createProfile(payload);
      }

      await refreshFamilyProfiles();
      await switchActiveProfile(saved);
      onProfileSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-brand-border overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-blue p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/10">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {editProfile ? `Edit Profile: ${editProfile.name}` : "Check Schemes: Select Beneficiary"}
              </h2>
              <p className="text-xs text-slate-300">
                {step === 1 ? "Step 1: Choose who you are checking government schemes for" : "Enter beneficiary details for personalized eligibility"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Ask Self vs Relative */}
          {step === 1 && !editProfile && (
            <div className="space-y-6 py-2">
              <div className="text-center space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-brand-navy">
                  Who would you like to check schemes for?
                </h3>
                <p className="text-xs text-slate-500">
                  You can check schemes for yourself or add multiple family members under your single account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Myself */}
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("self");
                    setSelectedRelationship("Self");
                    setStep(2);
                  }}
                  className="p-5 rounded-2xl border-2 border-slate-200 hover:border-brand-blue bg-white hover:bg-blue-50/40 text-left transition-all hover:shadow-md group flex flex-col justify-between space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center group-hover:scale-105 transition">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-brand-navy group-hover:text-brand-blue">
                      For Myself (Self)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Check welfare schemes, subsidies, and educational benefits matching your personal criteria.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center text-xs font-bold text-brand-blue gap-1">
                    <span>Continue for Self</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </button>

                {/* Option 2: A Relative */}
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("relative");
                    setStep(2);
                  }}
                  className="p-5 rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-white hover:bg-amber-50/40 text-left transition-all hover:shadow-md group flex flex-col justify-between space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-brand-navy group-hover:text-amber-700">
                      For a Relative / Family Member
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Find government benefits for your Father, Mother, Child, Spouse, or other dependents.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center text-xs font-bold text-amber-700 gap-1">
                    <span>Select Relationship</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Collect Person's Details */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Back to Step 1 button (if creating new) */}
              {!editProfile && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-slate-500 hover:text-brand-navy flex items-center gap-1 transition"
                >
                  ← Change selection ({targetType === "self" ? "Self" : "Relative"})
                </button>
              )}

              {/* Relationship Picker if Relative */}
              {targetType === "relative" && (
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Relationship with Account Holder <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {RELATIONSHIP_OPTIONS.map((rel) => {
                      const isSelected = selectedRelationship === rel.value;
                      return (
                        <button
                          key={rel.value}
                          type="button"
                          onClick={() => handleSelectRelationship(rel.value)}
                          className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-brand-blue text-white border-brand-blue shadow-sm font-black"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-bold"
                          }`}
                        >
                          <span className="text-xl">{rel.icon}</span>
                          <span className="text-xs">{rel.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Beneficiary Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={targetType === "self" ? "e.g. Ramesh Verma" : `e.g. ${selectedRelationship === "Father" ? "Ramlal Verma" : selectedRelationship === "Mother" ? "Sunita Verma" : "Aarav Verma"}`}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                  />
                </div>

                {/* Age & Date of Birth */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Age (Years) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={120}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="e.g. 58"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Transgender">Transgender</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* State Domicile */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    State Domicile <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                  >
                    {STATE_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. Pune, Varanasi, Jaipur"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                  />
                </div>

                {/* Occupation */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    Primary Occupation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                  >
                    {OCCUPATION_OPTIONS.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>

                {/* Land Holding if Farmer */}
                {formData.occupation.toLowerCase().includes("farmer") ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Agricultural Land (Acres)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={formData.landHoldingAcres}
                      onChange={(e) => setFormData({ ...formData, landHoldingAcres: e.target.value })}
                      placeholder="e.g. 2.0"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                    />
                  </div>
                ) : (
                  /* Education if not farmer */
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Educational Qualification
                    </label>
                    <select
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                    >
                      {EDUCATION_OPTIONS.map((edu) => (
                        <option key={edu} value={edu}>{edu}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Annual Income */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    Annual Income Bracket <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.annualIncome}
                    onChange={(e) => {
                      const found = INCOME_BRACKETS.find(b => b.value === e.target.value);
                      setFormData({
                        ...formData,
                        annualIncome: e.target.value,
                        incomeNumeric: found?.numeric || 80000
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                  >
                    {INCOME_BRACKETS.map((inc) => (
                      <option key={inc.value} value={inc.value}>{inc.label}</option>
                    ))}
                  </select>
                </div>

                {/* Social Category */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    Social Category / Caste
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
                  >
                    {["General", "OBC", "SC", "ST", "EWS"].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-blue hover:bg-brand-blue-dark text-white shadow-sm transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{saving ? "Saving & Evaluating..." : editProfile ? "Save Profile Changes" : "Save & Find Schemes"}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
