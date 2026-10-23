"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Bot, 
  Layers, 
  Bookmark, 
  User as UserIcon, 
  LogIn, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  HelpCircle,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user, profile, isAuthenticated } = useAuth();

  const featureShortcuts = isAuthenticated
    ? [
        {
          title: "Start Now (Details)",
          desc: "Conversational intake taking your details in your mother tongue",
          icon: Sparkles,
          color: "bg-teal-50 text-teal-600 border-teal-200",
          href: "/onboarding",
        },
        {
          title: "Browse Schemes",
          desc: "Explore government welfare programs matched to your profile",
          icon: Layers,
          color: "bg-blue-50 text-brand-blue border-blue-200",
          href: "/schemes",
        },
        {
          title: "My Profile",
          desc: "Verified profile attributes and criteria matching",
          icon: UserIcon,
          color: "bg-purple-50 text-purple-600 border-purple-200",
          href: "/profile",
        },
      ]
    : [
        {
          title: "Citizen Sign In",
          desc: "Log in to track your profile, discover schemes & drafts",
          icon: LogIn,
          color: "bg-blue-50 text-brand-blue border-blue-200",
          href: "/login",
        },
        {
          title: "Citizen Registration",
          desc: "Create an account in seconds to access your benefits",
          icon: CheckCircle2,
          color: "bg-teal-50 text-teal-600 border-teal-200",
          href: "/register",
        },
        {
          title: "Official Verification",
          desc: "Deterministic rule-grounded matching against guidelines",
          icon: ShieldCheck,
          color: "bg-indigo-50 text-indigo-600 border-indigo-200",
          href: "/login",
        },
        {
          title: "Admin Portal",
          desc: "Government officer scheme management & verification",
          icon: LayoutDashboard,
          color: "bg-amber-50 text-amber-600 border-amber-200",
          href: "/admin/login",
        },
      ];

  const steps = [
    {
      step: "01",
      title: "Enter Your Profile Details",
      desc: "Provide your occupation, state, age, family income, and category so we know which schemes fit your situation.",
      icon: UserIcon,
    },
    {
      step: "02",
      title: "Automatic Eligibility Filtering",
      desc: "Our deterministic rule engine matches your actual attributes against official scheme guidelines and exclusions.",
      icon: Search,
    },
    {
      step: "03",
      title: "Get Benefits & Apply",
      desc: "Review clear explanations of why you qualify, see required certificates, and click directly to official government portals.",
      icon: CheckCircle2,
    },
  ];

  const displayName = profile?.name || user?.email?.split("@")[0] || "Citizen";

  return (
    <main className="flex-1 bg-brand-bg relative overflow-hidden">
      {/* Decorative gradient glow blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-40 right-10 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-brand-border shadow-xs text-xs font-semibold text-brand-blue">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>Beyond Searching Schemes • Getting Citizens the Benefits They Deserve</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                <span className="text-brand-blue">Yojana </span>
                <span className="text-brand-teal">Hunter</span>
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-navy tracking-tight">
                Smart Government Scheme Guide & Eligibility Portal
              </h2>
            </div>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Find schemes tailored to your occupation, verify your eligibility with official rules, and prepare your application with ease.
            </p>

            {/* Authenticated User Welcome Banner */}
            {isAuthenticated ? (
              <div className="p-5 bg-white rounded-2xl border-2 border-brand-blue/30 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-brand-blue flex items-center justify-center font-bold text-lg">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-brand-navy">
                        Welcome back, {displayName}!
                      </h3>
                      <p className="text-xs text-slate-500">
                        Signed in as <span className="font-semibold text-slate-700">{user?.email}</span>
                        {profile?.occupation && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {profile.occupation}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Session
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-blue to-teal-600 hover:from-brand-blue-dark hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
                  >
                    <Sparkles className="w-4 h-4 text-teal-300" />
                    <span>Start Intake / Update Details</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-brand-border rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition"
                  >
                    <UserIcon className="w-4 h-4 text-brand-blue" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/schemes"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs sm:text-sm font-semibold transition"
                  >
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>Matching Schemes</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Public Call-to-Actions for visitors: Sign In, Register, and Admin Login */
              <div className="space-y-4 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Citizen Sign In Button (Primary CTA) */}
                  <Link
                    href="/login"
                    id="home-user-login-btn"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-brand-blue to-blue-600 hover:from-brand-blue-dark hover:to-blue-700 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-200 group"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Citizen Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {/* Register Option */}
                  <Link
                    href="/register"
                    id="home-register-btn"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-bold text-slate-800 bg-white hover:bg-slate-50 border-2 border-brand-border hover:border-slate-300 rounded-xl shadow-xs transition-all duration-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                    <span>Register</span>
                  </Link>

                  {/* Admin Login Button */}
                  <Link
                    href="/admin/login"
                    id="home-admin-login-btn"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-bold text-brand-navy bg-white hover:bg-slate-50 border-2 border-brand-border hover:border-slate-300 rounded-xl shadow-xs transition-all duration-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Admin Login</span>
                  </Link>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  Please <strong>Sign In</strong> or <strong>Register</strong> to enter your details, access matching schemes, and prepare applications. Government officers can access the Admin Portal via Admin Login.
                </p>
              </div>
            )}

            {/* Feature Shortcut Cards */}
            <div className={`grid gap-3 pt-3 ${isAuthenticated ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
              {featureShortcuts.map((feat) => {
                const Icon = feat.icon;
                return (
                  <Link
                    key={feat.title}
                    href={feat.href}
                    className="p-3 bg-white rounded-xl border border-brand-border shadow-card hover:shadow-card-hover hover:border-blue-300 transition group flex flex-col items-center text-center"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-2 transition group-hover:scale-105 ${feat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-brand-navy group-hover:text-brand-blue transition">
                      {feat.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Column: Hero Illustration */}
          <div className="lg:col-span-5 flex justify-center items-center relative">
            <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
              <Image
                src="/images/hero-illustration.svg"
                alt="Yojana Hunter Citizen Illustration"
                width={540}
                height={480}
                priority
                className="w-full h-auto drop-shadow-xl animate-float"
              />
            </div>
          </div>
        </div>

        {/* How Yojana Hunter Works Section */}
        <div className="pt-6 border-t border-brand-border space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-bold uppercase tracking-wider">
              Simple 3-Step Process
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
              How Yojana Hunter Works
            </h2>
            <p className="text-sm text-slate-600">
              A transparent, rule-grounded workflow ensuring eligible citizens find and claim their benefits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="p-6 bg-white rounded-2xl border border-brand-border shadow-card hover:border-blue-200 transition space-y-3 relative overflow-hidden"
                >
                  <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 select-none">
                    {st.step}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-brand-blue flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-brand-navy">
                    {st.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
