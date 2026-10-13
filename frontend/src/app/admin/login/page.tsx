"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { adminLogin, isAdminLoggedIn } from "@/services/adminService";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isAdminLoggedIn()) {
      router.push("/admin/dashboard");
    }
    if (searchParams.get("expired")) {
      setError("Your session has expired. Please sign in again.");
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validation
    if (!identifier.trim()) {
      setError("Please enter your admin email or username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(identifier.trim(), password);
      if (res.success) {
        router.push("/admin/dashboard");
      } else {
        setError(res.error || "Invalid administrator credentials.");
      }
    } catch {
      setError("An unexpected error occurred. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-brand-border shadow-card">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-8 h-8 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
              Admin Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Authorized Government Scheme Officers & Curators
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs sm:text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email / Username field */}
          <div className="space-y-1.5">
            <label
              htmlFor="identifier"
              className="block text-xs sm:text-sm font-bold text-slate-700"
            >
              Email or Username
            </label>
            <div className="relative rounded-xl border border-brand-border focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-blue-100 transition">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@yojanahunter.gov.in"
                disabled={loading}
                className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-transparent rounded-xl text-brand-navy placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Password field with show/hide */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-bold text-slate-700"
            >
              Password
            </label>
            <div className="relative rounded-xl border border-brand-border focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-blue-100 transition">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                className="block w-full pl-10 pr-11 py-2.5 text-sm bg-transparent rounded-xl text-brand-navy placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign in to Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-[11px] text-slate-500 font-medium">
            Protected System. Public registration is disabled.
          </p>
          <div className="flex justify-center">
            <Link
              href="/"
              className="text-xs font-semibold text-brand-blue hover:underline"
            >
              ← Return to Citizen Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-bg">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      }
    >
      <AdminLoginForm />
    </React.Suspense>
  );
}
