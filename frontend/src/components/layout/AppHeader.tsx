"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Globe, ChevronDown, User, Menu, X } from "lucide-react";
import { getStoredLanguage, saveStoredLanguage, getStoredProfile } from "@/lib/storage";
import { UserProfile } from "@/types/profile";

export const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const [lang, setLang] = useState<"en" | "hi" | "mr">("en");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setLang(getStoredLanguage());
    setProfile(getStoredProfile());
  }, [pathname]);

  const handleLangChange = (newLang: "en" | "hi" | "mr") => {
    setLang(newLang);
    saveStoredLanguage(newLang);
    setLangMenuOpen(false);
  };

  const isLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center p-1 shadow-sm">
            <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
              <path d="M7 21C7 21 8.5 13 16 11C23.5 9 25 7 25 7C25 7 24.5 15 18 19C13 22 7 21 7 21Z" fill="#16A36A"/>
              <path d="M12 21C14 18 17 15 22 13" stroke="#DCFCE7" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="21" cy="9" r="2" fill="#2DC6B1"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-brand-navy">
              Yojana<span className="text-brand-blue"> Hunter</span>
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition ${
              pathname === "/" ? "text-brand-blue font-semibold" : "text-slate-600 hover:text-brand-navy"
            }`}
          >
            Home
          </Link>
          <Link
            href="/schemes"
            className={`text-sm font-medium transition ${
              pathname === "/schemes" ? "text-brand-blue font-semibold" : "text-slate-600 hover:text-brand-navy"
            }`}
          >
            Schemes
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition ${
              pathname === "/dashboard" ? "text-brand-blue font-semibold" : "text-slate-600 hover:text-brand-navy"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/documents"
            className={`text-sm font-medium transition ${
              pathname === "/documents" ? "text-brand-blue font-semibold" : "text-slate-600 hover:text-brand-navy"
            }`}
          >
            Documents
          </Link>
          <Link
            href="/action-plan"
            className={`text-sm font-medium transition ${
              pathname === "/action-plan" ? "text-brand-blue font-semibold" : "text-slate-600 hover:text-brand-navy"
            }`}
          >
            Action Plan
          </Link>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border border-brand-border rounded-lg hover:bg-slate-100 transition"
              aria-label="Select language"
            >
              <Globe className="w-3.5 h-3.5 text-brand-blue" />
              <span>{lang === "en" ? "English" : lang === "hi" ? "हिंदी" : "मराठी"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-brand-border py-1.5 z-50">
                <button
                  onClick={() => handleLangChange("en")}
                  className={`w-full text-left px-3.5 py-1.5 text-xs sm:text-sm transition ${
                    lang === "en" ? "bg-blue-50 text-brand-blue font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLangChange("hi")}
                  className={`w-full text-left px-3.5 py-1.5 text-xs sm:text-sm transition ${
                    lang === "hi" ? "bg-blue-50 text-brand-blue font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => handleLangChange("mr")}
                  className={`w-full text-left px-3.5 py-1.5 text-xs sm:text-sm transition ${
                    lang === "mr" ? "bg-blue-50 text-brand-blue font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  मराठी
                </button>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <Link
            href="/dashboard"
            className="relative p-2 text-slate-500 hover:text-brand-navy rounded-lg hover:bg-slate-100 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </Link>

          {/* User Profile Avatar or Get Started Button */}
          {isLanding ? (
            <Link
              href="/onboarding"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark rounded-lg shadow-sm transition"
            >
              Get Started
            </Link>
          ) : (
            <Link
              href="/profile"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-50 border border-brand-border hover:bg-slate-100 transition"
              title="View Profile"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-blue to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {profile?.name ? profile.name.charAt(0) : "A"}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-brand-navy">
                {profile?.name ? profile.name.split(" ")[0] : "Aditi"}
              </span>
            </Link>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-border bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            href="/onboarding"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Get Started (Onboarding)
          </Link>
          <Link
            href="/interview"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            AI Interview
          </Link>
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Profile Summary
          </Link>
          <Link
            href="/schemes"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Schemes Matching
          </Link>
          <Link
            href="/action-plan"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Action Plan
          </Link>
          <Link
            href="/documents"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Document Readiness
          </Link>
          <Link
            href="/application-draft"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Application Draft
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      )}
    </header>
  );
};
