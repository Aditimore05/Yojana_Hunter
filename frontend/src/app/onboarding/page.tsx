"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ArrowRight } from "lucide-react";
import { saveStoredLanguage, getStoredLanguage } from "@/lib/storage";

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<"en" | "hi" | "mr">(getStoredLanguage() || "en");

  const handleContinue = () => {
    saveStoredLanguage(selectedLang);
    router.push("/interview");
  };

  const languages = [
    { id: "en", label: "English", native: "English" },
    { id: "hi", label: "Hindi", native: "हिंदी" },
    { id: "mr", label: "Marathi", native: "मराठी" },
  ] as const;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-brand-bg">
      {/* Decorative gradient aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Centered Onboarding Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-floating p-6 sm:p-8 relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center p-1 shadow-xs">
            <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
              <path d="M7 21C7 21 8.5 13 16 11C23.5 9 25 7 25 7C25 7 24.5 15 18 19C13 22 7 21 7 21Z" fill="#16A36A"/>
              <path d="M12 21C14 18 17 15 22 13" stroke="#DCFCE7" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="21" cy="9" r="2" fill="#2DC6B1"/>
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-brand-navy">
            Yojana<span className="text-brand-blue"> Hunter</span>
          </span>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl font-extrabold text-brand-navy">
          Choose Your Language
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Select your preferred language to continue
        </p>

        {/* Language Options */}
        <div className="w-full mt-6 space-y-3">
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-between font-bold text-sm sm:text-base transition-all duration-200 ${
                  isSelected
                    ? "bg-brand-blue text-white shadow-md ring-2 ring-brand-blue/30"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-brand-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.native}</span>
                  {lang.id !== "en" && (
                    <span className={`text-xs ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                      ({lang.label})
                    </span>
                  )}
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-300"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full mt-6 py-3.5 px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition group"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Small Footer Links */}
        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>Government Schemes</span>
          <span>·</span>
          <span>Citizen First</span>
        </div>

        {/* Delicate Monument Skyline along bottom of card */}
        <div className="w-full mt-6 pt-2 border-t border-slate-100 opacity-60">
          <Image
            src="/images/monuments-skyline.svg"
            alt="Skyline"
            width={400}
            height={40}
            className="w-full h-8 object-cover object-bottom"
          />
        </div>
      </div>
    </main>
  );
}
