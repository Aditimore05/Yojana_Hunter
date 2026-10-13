import React from "react";
import { EligibilityStatus } from "@/types/scheme";
import { CheckCircle2, Clock, XCircle, HelpCircle, AlertTriangle } from "lucide-react";

interface Props {
  status: EligibilityStatus;
  size?: "sm" | "md";
}

export const EligibilityBadge: React.FC<Props> = ({ status, size = "md" }) => {
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-xs gap-1" : "px-3 py-1 text-xs sm:text-sm gap-1.5";

  if (status === "eligible") {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs ${sizeClasses}`}
      >
        <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
        <span>Eligible</span>
      </span>
    );
  }

  if (status === "possibly_eligible" || status === "almost") {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs ${sizeClasses}`}
      >
        <Clock className={size === "sm" ? "w-3 h-3 text-amber-600" : "w-4 h-4 text-amber-600"} />
        <span>Possibly Eligible</span>
      </span>
    );
  }

  if (status === "applications_closed") {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs ${sizeClasses}`}
      >
        <AlertTriangle className={size === "sm" ? "w-3 h-3 text-purple-600" : "w-4 h-4 text-purple-600"} />
        <span>Applications Closed</span>
      </span>
    );
  }

  if (status === "eligibility_unknown") {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs ${sizeClasses}`}
      >
        <HelpCircle className={size === "sm" ? "w-3 h-3 text-slate-500" : "w-4 h-4 text-slate-500"} />
        <span>Eligibility Unknown</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs ${sizeClasses}`}
    >
      <XCircle className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      <span>Not Eligible</span>
    </span>
  );
};
