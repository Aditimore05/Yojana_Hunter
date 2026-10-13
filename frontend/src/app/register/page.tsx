"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  Check,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getStoredProfile } from "@/lib/storage";
import { UserProfile } from "@/types/profile";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [linkExistingProfile, setLinkExistingProfile] = useState(true);
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    }
    const stored = getStoredProfile();
    if (stored && (stored.occupation || stored.state)) {
      setExistingProfile(stored);
    }
  }, [isAuthenticated, redirectUrl, router]);

  // Password strength calculations
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthScore = [hasMinLength, hasLetter, hasNumberOrSymbol].filter(Boolean).length;
  const strengthText = strengthScore === 3 ? "Strong" : strengthScore === 2 ? "Medium" : "Weak";
  const strengthColor = strengthScore === 3 ? "bg-emerald-500" : strengthScore === 2 ? "bg-amber-500" : "bg-rose-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: trimmedName,
        email: trimmedEmail,
        password,
        confirmPassword,
      };

      if (linkExistingProfile && existingProfile) {
        payload.profileData = existingProfile;
      }

      const res = await register(payload);

      if (res.success) {
        router.push(redirectUrl);
      } else {
        setError(res.error || "Failed to create account. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-brand-bg">
      {/* Left Column: Form Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-2xl border border-brand-border shadow-card space-y-6">
          {/* Header */}
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
              Create an account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Get personalized scheme recommendations, track benefits, and prepare applications safely.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs sm:text-sm animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                Full Name
              </label>
              <div className="relative rounded-xl border border-brand-border focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-blue-100 transition">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="e.g. Aditi Lagad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Email Address */}
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

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                Password
              </label>
              <div className="relative rounded-xl border border-brand-border focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-blue-100 transition">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="new-password"
                  name="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="At least 8 characters"
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="font-semibold text-slate-600">Password strength:</span>
                    <span className={`font-bold ${
                      strengthScore === 3 ? "text-emerald-600" : strengthScore === 2 ? "text-amber-600" : "text-rose-600"
                    }`}>
                      {strengthText}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${strengthScore >= 1 ? strengthColor : "bg-slate-200"}`} />
                    <div className={`h-full flex-1 rounded-full ${strengthScore >= 2 ? strengthColor : "bg-slate-200"}`} />
                    <div className={`h-full flex-1 rounded-full ${strengthScore >= 3 ? strengthColor : "bg-slate-200"}`} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-3xs text-slate-500 pt-0.5">
                    <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 font-semibold" : ""}`}>
                      {hasMinLength ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />} 8+ chars
                    </span>
                    <span className={`flex items-center gap-1 ${hasLetter ? "text-emerald-600 font-semibold" : ""}`}>
                      {hasLetter ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />} Letters
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumberOrSymbol ? "text-emerald-600 font-semibold" : ""}`}>
                      {hasNumberOrSymbol ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />} Numbers/symbols
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                Confirm Password
              </label>
              <div className="relative rounded-xl border border-brand-border focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-blue-100 transition">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Preserved Anonymous Profile Association with Consent */}
            {existingProfile && (existingProfile.occupation || existingProfile.state) && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-xs text-slate-700">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={linkExistingProfile}
                    onChange={(e) => setLinkExistingProfile(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-blue border-slate-300 focus:ring-brand-blue mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-brand-navy">
                      Save my scheme eligibility profile to this account
                    </span>
                    <p className="text-2xs text-slate-500 mt-0.5">
                      Occupation: {existingProfile.occupation || "Citizen"} · State: {existingProfile.state || "All India"} · Category: {existingProfile.category || "General"}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Privacy Policy and Terms Agreement */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded text-brand-blue border-slate-300 focus:ring-brand-blue mt-0.5"
                />
                <span className="text-xs text-slate-600 leading-snug">
                  I agree to the{" "}
                  <span className="text-brand-blue font-semibold hover:underline">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-brand-blue font-semibold hover:underline">Privacy Policy</span>.
                  My data will only be used for scheme matching.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !agreeTerms}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.99] transition shadow-md hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="pt-2 text-center text-xs sm:text-sm text-slate-500 border-t border-brand-border">
            <span>Already have an account? </span>
            <Link
              href={`/login${redirectUrl !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="font-bold text-brand-blue hover:text-brand-blue-dark transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Hero / Benefits */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-brand-navy to-slate-900 text-white p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Citizen Registration</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight leading-snug">
              Unlock the welfare benefits meant for you and your family.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Join thousands of citizens using Yojana Hunter to accurately discover, track, and apply for government schemes without intermediaries or hassle.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Privacy First</h4>
                <p className="text-2xs text-slate-300 mt-0.5">Your profile and income data remain strictly confidential and encrypted.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Smart Eligibility Profile</h4>
                <p className="text-2xs text-slate-300 mt-0.5">Answer the 6 criteria once or conversational AI will guide you smoothly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    }>
      <RegisterFormContent />
    </Suspense>
  );
}
