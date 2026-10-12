import React from "react";
import Image from "next/image";
import { ShieldCheck, Lock, EyeOff } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-brand-border pt-12 pb-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 3 Trust Badges Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1 */}
          <div className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-xl border border-brand-border shadow-card hover:shadow-card-hover transition">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-brand-navy">Trusted Sources</h4>
              <p className="text-xs sm:text-sm text-slate-500">Official Government Links</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-xl border border-brand-border shadow-card hover:shadow-card-hover transition">
            <div className="w-11 h-11 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <EyeOff className="w-6 h-6 text-brand-teal" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-brand-navy">Your Privacy Matters</h4>
              <p className="text-xs sm:text-sm text-slate-500">No Aadhaar / OTP / Bank Details</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-xl border border-brand-border shadow-card hover:shadow-card-hover transition">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-brand-navy">Secure &amp; Transparent</h4>
              <p className="text-xs sm:text-sm text-slate-500">Open Source + Audit Logs</p>
            </div>
          </div>
        </div>

        {/* Brand Slogan */}
        <div className="text-center py-4">
          <p className="text-sm sm:text-base font-bold text-slate-700 tracking-wide flex items-center justify-center gap-2 flex-wrap">
            <span>Right Scheme</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Right Time</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-teal"></span>
            <span className="text-brand-blue font-extrabold">Better Tomorrow</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            © {new Date().getFullYear()} Yojana Hunter. Empowering citizens across India with AI-driven welfare discovery.
          </p>
        </div>
      </div>

      {/* Decorative monuments skyline illustration along bottom */}
      <div className="w-full mt-4 flex justify-center pointer-events-none select-none opacity-40">
        <Image
          src="/images/monuments-skyline.svg"
          alt="Monuments Skyline"
          width={1200}
          height={80}
          className="w-full max-h-20 object-cover object-bottom"
        />
      </div>
    </footer>
  );
};
