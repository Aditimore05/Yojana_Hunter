"use client";

import React, { useState, useEffect } from "react";
import { Settings, Globe, Shield, Bell, CheckCircle2, User } from "lucide-react";
import { getStoredLanguage, saveStoredLanguage, getStoredProfile } from "@/lib/storage";

export default function SettingsPage() {
  const [lang, setLang] = useState<"en" | "hi" | "mr">("en");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLang(getStoredLanguage());
  }, []);

  const handleLangChange = (l: "en" | "hi" | "mr") => {
    setLang(l);
    saveStoredLanguage(l);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Settings &amp; Preferences
          </h1>
          <p className="text-sm text-slate-500">
            Manage your account language, privacy consent, and notifications
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Language Selection Card */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-brand-navy">
                Interface Language
              </h2>
              <p className="text-xs text-slate-500">
                Choose the language you prefer for questions and assistance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { id: "en", label: "English" },
              { id: "hi", label: "हिंदी (Hindi)" },
              { id: "mr", label: "मराठी (Marathi)" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleLangChange(item.id as any)}
                className={`p-3 rounded-xl text-xs sm:text-sm font-bold border transition ${
                  lang === item.id
                    ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-brand-border"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy & Consent Settings */}
        <div className="p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-brand-teal flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-brand-navy">
                Privacy &amp; Data Consent
              </h2>
              <p className="text-xs text-slate-500">
                We strictly adhere to zero Aadhaar / OTP storage policy
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-blue rounded" />
              <span>Allow anonymous eligibility matching rules cache</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-blue rounded" />
              <span>Store document metadata on local encrypted browser storage only</span>
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}
