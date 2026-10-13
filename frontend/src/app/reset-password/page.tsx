"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  KeyRound,
  Check,
  X
} from "lucide-react";
import { resetPassword } from "@/services/authService";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthScore = [hasMinLength, hasLetter, hasNumberOrSymbol].filter(Boolean).length;
  const strengthText = strengthScore === 3 ? "Strong" : strengthScore === 2 ? "Medium" : "Weak";
  const strengthColor = strengthScore === 3 ? "bg-emerald-500" : strengthScore === 2 ? "bg-amber-500" : "bg-rose-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Password reset token is missing. Please check your link or request a new one.");
      return;
    }
    if (!password) {
      setError("Please enter a new password.");
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

    setLoading(true);
    try {
      const res = await resetPassword(token.trim(), password, confirmPassword);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Failed to reset password. The link may have expired.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-brand-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-2xl border border-brand-border shadow-card space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-blue mb-2 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Please enter and confirm your new secure password.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs sm:text-sm animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Password Reset Complete</p>
                <p className="text-slate-600">
                  Your password has been securely updated. You can now log in using your new credentials.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark shadow-md transition"
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If token wasn't in URL, let user paste it */}
            {!tokenFromUrl && (
              <div className="space-y-1.5">
                <label
                  htmlFor="token"
                  className="block text-xs sm:text-sm font-bold text-slate-700"
                >
                  Reset Token
                </label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  placeholder="Paste your reset token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                  className="block w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-brand-border text-xs sm:text-sm text-slate-900 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                New Password
              </label>
              <div className="relative rounded-xl border border-brand-border focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-blue-100 transition">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
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

              {/* Strength Feedback */}
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
                Confirm New Password
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
                  placeholder="Re-enter your new password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.99] transition shadow-md hover:shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs sm:text-sm text-slate-500 border-t border-brand-border">
          <Link
            href="/login"
            className="font-bold text-brand-blue hover:text-brand-blue-dark transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
