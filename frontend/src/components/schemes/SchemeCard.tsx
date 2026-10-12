import React from "react";
import Link from "next/link";
import { GraduationCap, Award, Wrench, FileWarning, ArrowRight, BookOpen } from "lucide-react";
import { Scheme } from "@/types/scheme";
import { EligibilityBadge } from "./EligibilityBadge";

interface Props {
  scheme: Scheme;
}

export const SchemeCard: React.FC<Props> = ({ scheme }) => {
  const getIcon = () => {
    switch (scheme.id) {
      case "pm-vidyalakshmi":
        return (
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-amber-600" />
          </div>
        );
      case "post-matric-scholarship":
        return (
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
        );
      case "skill-india-training":
        return (
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6 text-orange-600" />
          </div>
        );
      case "mjp-jan-arogya":
        return (
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            <FileWarning className="w-6 h-6 text-rose-600" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-brand-blue" />
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-brand-border shadow-card hover:shadow-card-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left side content */}
      <div className="flex items-start gap-4">
        {getIcon()}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-bold text-base sm:text-lg text-brand-navy">
              {scheme.name}
            </h3>
            <EligibilityBadge status={scheme.eligibilityStatus} size="sm" />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {scheme.shortDescription}
          </p>

          <div className="mt-2.5 flex items-center gap-4 text-xs flex-wrap">
            {scheme.benefit && (
              <span className="text-slate-600 font-medium">
                Benefit: <span className="font-semibold text-slate-800">{scheme.benefit}</span>
              </span>
            )}

            {scheme.matchScore !== undefined && scheme.eligibilityStatus !== "ineligible" && (
              <span className="font-bold text-emerald-600">
                Match: {scheme.matchScore}%
              </span>
            )}

            {scheme.ineligibleReason && (
              <span className="font-medium text-rose-600">
                Reason: {scheme.ineligibleReason}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Action */}
      <div className="shrink-0 self-end sm:self-center">
        <Link
          href={`/schemes/${scheme.id}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-blue hover:text-brand-blue-dark hover:underline transition"
        >
          <span>View Details</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
