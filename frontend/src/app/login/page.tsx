"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Award
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await login({
        email: trimmedEmail,
        password,
        rememberMe,
      });

      if (res.success) {
        router.push(redirectUrl);
      } else {
        setError(res.error || "Invalid email or password. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-brand-bg">
      {/* Left Column: Login Form Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-2xl border border-brand-border shadow-card space-y-6">
          {/* Brand Header */}
          <div className="space-y-2">
            <Link href="/" className="inline-flex items-center gap-2 group mb-2">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center p-1.5 shadow-xs">
                <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                  <path d="M7 21C7 21 8.5 13 16 11C23.5 9 25 7 25 7C25 7 24.5 15 18 19C13 22 7 21 7 21Z" fill="#16A36A"/>
                  <path d="M12 21C14 18 17 15 22 13" stroke="#DCFCE7" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="21" cy="9" r="2" fill="#2DC6B1"/>
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-brand-navy">
                Yojana<span className="text-brand-blue"> Hunter</span>
              </span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Sign in to track your scheme applications, verified entitlements, and document readiness.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs sm:text-sm animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 font-medium">
                <span>{error}</span>
                {error.toLowerCase().includes("not registered") && (
                  <span className="block mt-1.5 font-bold">
                    <Link
                      href={`/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
                      className="text-brand-blue hover:underline inline-flex items-center gap-1"
                    >
                      <span>Create your free citizen account here</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                Email Address
              </label>
              <div className="relative rounded-xl border border-brand-border focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-blue-100 transition">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-bold text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand-blue hover:text-brand-blue-dark transition"
                >
                  Forgot password?
                </Link>
              </div>
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded text-brand-blue border-slate-300 focus:ring-brand-blue"
                />
                <span className="text-xs sm:text-sm text-slate-600 font-medium">
                  Remember me for 30 days
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.99] transition shadow-md hover:shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="pt-2 text-center text-xs sm:text-sm text-slate-500 border-t border-brand-border">
            <span>Don't have an account yet? </span>
            <Link
              href={`/register${redirectUrl !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="font-bold text-brand-blue hover:text-brand-blue-dark transition"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Benefits & Trust Panel */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-brand-navy to-slate-900 text-white p-12 items-center justify-center relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Citizen Entitlement Intelligence</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight leading-snug">
              Beyond searching schemes, getting citizens the benefits they deserve.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Log in to access deterministic eligibility checks grounded in official Central and State gazettes, without misinformation.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">100% Verified Sources</h4>
                <p className="text-2xs text-slate-300 mt-0.5">Direct links to official MyScheme, NSP, and ministry portals.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Personalized Criteria Matching</h4>
                <p className="text-2xs text-slate-300 mt-0.5">Matched using your occupation, income, state, age, and category.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Award className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Saved Schemes & Drafts</h4>
                <p className="text-2xs text-slate-300 mt-0.5">Track bookmarks and auto-fill official application drafts effortlessly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
