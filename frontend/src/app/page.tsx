"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bot, Layers, FolderCheck, FileEdit, CheckCircle2, Sparkles } from "lucide-react";

export default function LandingPage() {
  const featureShortcuts = [
    {
      title: "AI Interview",
      desc: "Conversational intake in your mother tongue",
      icon: Bot,
      color: "bg-teal-50 text-teal-600 border-teal-200",
      href: "/interview",
    },
    {
      title: "Smart Matching",
      desc: "Deterministic rule engine with official citations",
      icon: Layers,
      color: "bg-blue-50 text-brand-blue border-blue-200",
      href: "/schemes",
    },
    {
      title: "Document Check",
      desc: "Automated OCR checklist & missing items alert",
      icon: FolderCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      href: "/documents",
    },
    {
      title: "Application Draft",
      desc: "Pre-filled official drafts ready for download",
      icon: FileEdit,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      href: "/application-draft",
    },
  ];

  return (
    <main className="flex-1 bg-brand-bg relative overflow-hidden">
      {/* Decorative gradient glow blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-40 right-10 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-brand-border shadow-xs text-xs font-semibold text-brand-blue">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>Next-Gen Citizen Welfare AI Platform</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                <span className="text-brand-blue">Yojana </span>
                <span className="text-brand-teal">Hunter</span>
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-navy tracking-tight">
                Your Government Scheme Guide
              </h2>
            </div>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Find the right schemes, check your eligibility, get documents, and prepare your application — all in one place.
            </p>

            {/* 4 Feature Shortcut Cards in a row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
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

            {/* Primary Action Button */}
            <div className="pt-4 space-y-3">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-brand-blue hover:bg-brand-blue-dark rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-200 group"
              >
                <span>Start Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Trust labels */}
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 pt-1">
                <span>Simple</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Secure</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Trustworthy</span>
              </div>
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
      </div>
    </main>
  );
}
