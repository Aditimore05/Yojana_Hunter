"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound, ExternalLink } from "lucide-react";
import { forgotPassword } from "@/services/authService";
import { ForgotPasswordResponse } from "@/types/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(trimmed);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || "Unable to process request. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-brand-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-2xl border border-brand-border shadow-card space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-blue mb-2 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>

          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-blue mb-2 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter the email address registered with your Yojana Hunter account. We will send you instructions to reset your password.
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
        {result ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Password Reset Instructions Generated</p>
                <p className="text-slate-600">
                  {result.message}
                </p>
              </div>
            </div>

            {/* Development token link if SMTP unconfigured */}
            {result.dev_reset_token && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <span>Development Mode Notification</span>
                </div>
                <p className="text-2xs text-amber-700 leading-relaxed">
                  SMTP email credentials are not configured in environment variables. For testing, you can use the direct reset link generated below:
                </p>
                <Link
                  href={result.dev_reset_link || `/reset-password?token=${result.dev_reset_token}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <span>Open Password Reset Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-brand-navy bg-slate-100 hover:bg-slate-200 transition"
              >
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-bold text-slate-700"
              >
                Registered Email Address
              </label>
              <div className="relative rounded-xl border border-brand-border focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-blue-100 transition">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue-dark active:scale-[0.99] transition shadow-md hover:shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
