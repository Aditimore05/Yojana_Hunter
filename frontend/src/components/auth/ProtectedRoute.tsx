"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldCheck } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const redirectUrl = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?redirect=${redirectUrl}`);
    }
  }, [isAuthenticated, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs animate-pulse">
          <ShieldCheck className="w-6 h-6 text-brand-blue" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
          <span>Verifying session security...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
