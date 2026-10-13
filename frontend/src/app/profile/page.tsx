"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Edit3, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  IndianRupee, 
  Layers, 
  Calendar,
  X,
  Save
} from "lucide-react";
import { getStoredProfile, saveStoredProfile } from "@/lib/storage";
import { fetchProfile, updateProfile } from "@/services/profileService";
import { UserProfile } from "@/types/profile";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

function ProfileSummaryContent() {
  const router = useRouter();
  const { profile: authProfile, updateProfileState } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(authProfile || getStoredProfile());
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<UserProfile>(authProfile || getStoredProfile());

  useEffect(() => {
    fetchProfile().then((loaded) => {
      if (loaded) {
        setProfile(loaded);
        setEditFormData(loaded);
        updateProfileState(loaded);
      }
    });
  }, [updateProfileState]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editFormData);
    updateProfileState(editFormData);
    await updateProfile(editFormData);
    setIsEditing(false);
  };

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Title with Edit button */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Your Profile Summary
          </h1>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-brand-blue bg-white border border-brand-border hover:bg-blue-50 shadow-xs transition"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>

        {/* Profile Identity Card */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-blue to-teal-400 flex items-center justify-center text-white text-2xl font-black shadow-md">
              {profile.name ? profile.name.charAt(0) : "A"}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-brand-navy">
                {profile.name}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {profile.occupation}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-status-eligible-bg text-status-eligible-text border border-status-eligible-border font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile Complete {profile.completenessPercent}%</span>
          </div>
        </div>

        {/* 6 Info Grid Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Age */}
          <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Age</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-brand-navy">
              {profile.age} years
            </div>
          </div>

          {/* State */}
          <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>State</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-brand-navy">
              {profile.state}
            </div>
          </div>

          {/* District */}
          <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>District</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-brand-navy">
              {profile.district}
            </div>
          </div>

          {/* Annual Income */}
          <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
              <span>Annual Income</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-brand-navy">
              {profile.annualIncome}
            </div>
          </div>

          {/* Education */}
          <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Education</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-brand-navy truncate">
              {profile.education}
            </div>
          </div>

          {/* Category */}
          <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-brand-navy">
              {profile.category}
            </div>
          </div>
        </div>

        {/* Key Information with Green Checkmarks */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-brand-navy">
            Key Information
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong className="text-brand-navy font-semibold">Occupation :</strong> {profile.occupation}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong className="text-brand-navy font-semibold">Family Income :</strong> {profile.annualIncome}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong className="text-brand-navy font-semibold">Education :</strong> {profile.education}
              </span>
            </div>
          </div>
        </div>

        {/* Next: Find My Schemes Button */}
        <div className="pt-2">
          <button
            onClick={() => router.push("/schemes")}
            className="w-full py-4 px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-base shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 transition group"
          >
            <span>Next : Find My Schemes</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-brand-navy/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-floating border border-brand-border p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-lg text-brand-navy">Edit Profile Details</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={editFormData.occupation}
                    onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({ ...editFormData, age: parseInt(e.target.value) || 21 })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Family Income</label>
                  <select
                    value={editFormData.annualIncome}
                    onChange={(e) => setEditFormData({ ...editFormData, annualIncome: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  >
                    <option value="< 1 Lakh">&lt; 1 Lakh</option>
                    <option value="1 – 3 Lakh">1 – 3 Lakh</option>
                    <option value="3 – 5 Lakh">3 – 5 Lakh</option>
                    <option value="> 5 Lakh">&gt; 5 Lakh</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Education</label>
                <input
                  type="text"
                  value={editFormData.education}
                  onChange={(e) => setEditFormData({ ...editFormData, education: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs sm:text-sm font-bold bg-brand-blue hover:bg-brand-blue-dark text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ProfileSummaryPage() {
  return (
    <ProtectedRoute>
      <ProfileSummaryContent />
    </ProtectedRoute>
  );
}
