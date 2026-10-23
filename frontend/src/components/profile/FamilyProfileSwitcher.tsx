"use client";

import React, { useState } from "react";
import { 
  Users, 
  UserCheck, 
  Plus, 
  CheckCircle2, 
  Edit3, 
  Sparkles,
  Heart,
  ChevronDown
} from "lucide-react";
import { UserProfile, FamilyRelationship } from "@/types/profile";
import { useAuth } from "@/context/AuthContext";
import { FamilyProfileModal } from "./FamilyProfileModal";

interface FamilyProfileSwitcherProps {
  onProfileChanged?: (profile: UserProfile) => void;
  className?: string;
}

const RELATION_ICONS: Record<string, string> = {
  Self: "👤",
  Father: "👨",
  Mother: "👩",
  Child: "🧒",
  Spouse: "💍",
  Other: "🤝",
};

export function FamilyProfileSwitcher({ onProfileChanged, className = "" }: FamilyProfileSwitcherProps) {
  const { profile, familyProfiles, switchActiveProfile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<UserProfile | null>(null);

  const activeRelationship = (profile?.relationship as FamilyRelationship) || "Self";
  const activeIcon = RELATION_ICONS[activeRelationship] || "👤";
  const activeName = profile?.name || profile?.fullName || "Myself";

  const handleSelectProfile = async (p: UserProfile) => {
    await switchActiveProfile(p);
    if (onProfileChanged) {
      onProfileChanged(p);
    }
  };

  const handleOpenAdd = () => {
    setEditingTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (profile) {
      setEditingTarget(profile);
      setModalOpen(true);
    }
  };

  return (
    <>
      <div className={`p-4 bg-white rounded-2xl border border-brand-border shadow-xs space-y-3 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Active Beneficiary Label */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-lg shrink-0">
              {activeIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">
                  Checking Schemes For:
                </span>
                <span className="px-2 py-0.5 rounded-md text-2xs font-black bg-blue-100 text-brand-blue border border-blue-200">
                  {activeRelationship}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-brand-navy leading-tight">
                {activeName}
              </h3>
            </div>
          </div>

          {/* Quick Actions: Edit Current or Add New */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Edit details for this person"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Person</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-blue hover:bg-brand-blue-dark text-white shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Check for Someone Else</span>
            </button>
          </div>
        </div>

        {/* Family Member Profile Pills */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-2xs font-extrabold uppercase text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span>Family Profiles:</span>
          </span>

          {familyProfiles && familyProfiles.length > 0 ? (
            familyProfiles.map((p) => {
              const rel = p.relationship || "Self";
              const icon = RELATION_ICONS[rel] || "👤";
              const isSelected = profile && (
                (p.id && profile.id && p.id === profile.id) ||
                (p.name === profile.name && rel === profile.relationship)
              );

              return (
                <button
                  key={p.id || `${rel}-${p.name}`}
                  type="button"
                  onClick={() => handleSelectProfile(p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border shrink-0 ${
                    isSelected
                      ? "bg-brand-navy text-white border-brand-navy shadow-xs ring-2 ring-brand-blue/30"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span>{icon}</span>
                  <span>{p.name || rel}</span>
                  <span className={`text-2xs px-1.5 py-0.2 rounded-md ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {rel}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />}
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-400 italic">No relatives added yet. Click &quot;Check for Someone Else&quot; above.</span>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-slate-300 text-slate-600 hover:text-brand-blue hover:border-brand-blue hover:bg-blue-50/50 transition shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Add Relative</span>
          </button>
        </div>
      </div>

      {/* Modal for adding or editing beneficiary */}
      <FamilyProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editProfile={editingTarget}
        onProfileSaved={(saved) => {
          if (onProfileChanged) {
            onProfileChanged(saved);
          }
        }}
      />
    </>
  );
}
