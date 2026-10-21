"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DocumentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/schemes");
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-3 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Redirecting to Schemes...</p>
      </div>
    </div>
  );
}
