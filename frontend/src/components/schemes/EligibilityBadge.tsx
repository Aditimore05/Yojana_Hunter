import React from "react";
import { EligibilityStatus } from "@/types/scheme";

interface Props {
  status: EligibilityStatus;
  size?: "sm" | "md";
}

export const EligibilityBadge: React.FC<Props> = ({ status, size = "md" }) => {
  if (status === "eligible") {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-status-eligible-bg text-status-eligible-text border border-status-eligible-border ${
          size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs sm:text-sm"
        }`}
      >
        Eligible
      </span>
    );
  }

  if (status === "almost") {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-status-almost-bg text-status-almost-text border border-status-almost-border ${
          size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs sm:text-sm"
        }`}
      >
        Almost Eligible
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-status-ineligible-bg text-status-ineligible-text border border-status-ineligible-border ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs sm:text-sm"
      }`}
    >
      Not Eligible
    </span>
  );
};
