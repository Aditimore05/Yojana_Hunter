"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crown } from "lucide-react";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";

export default function SubscriptionPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
          <Crown className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Yojana Hunter <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Premium Access</span>
        </h1>
        <p className="text-sm text-slate-400">
          Access all matching Central and State government schemes beyond the 5-scheme free tier.
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition"
          >
            Open Subscription Plans
          </button>
          <Link
            href="/schemes"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Schemes</span>
          </Link>
        </div>
      </div>

      <SubscriptionModal
        isOpen={modalOpen}
        onClose={() => router.push("/schemes")}
        onSubscriptionUpdated={() => router.push("/schemes")}
      />
    </div>
  );
}
