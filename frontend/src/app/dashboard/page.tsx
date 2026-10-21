"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Bot, 
  Layers, 
  Bookmark, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Clock, 
  Sparkles,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getStoredProfile } from "@/lib/storage";
import { demoCategoryDistribution, demoRecentActivities } from "@/data/demoData";
import { UserProfile } from "@/types/profile";
import { getSchemes } from "@/services/schemeService";
import { Scheme } from "@/types/scheme";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

function DashboardContent() {
  const { profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(authProfile || getStoredProfile());
  const [mounted, setMounted] = useState(false);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [counts, setCounts] = useState({ total: 12, eligible: 6, almost: 3, ineligible: 3 });

  useEffect(() => {
    const active = authProfile || getStoredProfile();
    setProfile(active);
    setMounted(true);

    async function loadData() {
      const data = await getSchemes("all", undefined, "all", "all", active);
      if (data) {
        setSchemes(data);
        setCounts({
          total: data.length,
          eligible: data.filter((s) => s.eligibilityStatus === "eligible").length,
          almost: data.filter((s) => s.eligibilityStatus === "possibly_eligible" || (s as any).legacyEligibilityStatus === "almost").length,
          ineligible: data.filter((s) => s.eligibilityStatus === "not_eligible" || (s as any).legacyEligibilityStatus === "ineligible").length,
        });
      }
    }
    loadData();
  }, [authProfile]);

  const stats = [
    { label: "Total Schemes Found", value: counts.total, color: "text-brand-blue", bg: "bg-blue-50/70 border-blue-100" },
    { label: "Eligible", value: counts.eligible, color: "text-emerald-600", bg: "bg-emerald-50/70 border-emerald-100", icon: CheckCircle2 },
    { label: "Almost Eligible", value: counts.almost, color: "text-amber-600", bg: "bg-amber-50/70 border-amber-100", icon: AlertTriangle },
    { label: "Not Eligible", value: counts.ineligible, color: "text-rose-600", bg: "bg-rose-50/70 border-rose-100", icon: XCircle },
  ];

  const topOpportunities = schemes.slice(0, 3).map((s) => ({
    id: s.slug || s.id,
    name: s.name,
    match: `${s.matchScore || 100}% Match`,
    priority: s.priority || "High Priority",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  }));

  const quickActions = [
    { title: "Continue Interview", href: "/interview", icon: Bot, color: "text-teal-600 bg-teal-50" },
    { title: "View All Schemes", href: "/schemes", icon: Layers, color: "text-brand-blue bg-blue-50" },
    { title: "Saved Schemes", href: "/saved-schemes", icon: Bookmark, color: "text-emerald-600 bg-emerald-50" },
    { title: "Download Reports", href: "/application-draft", icon: Download, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <main className="flex-1 bg-brand-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Personalized Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight flex items-center gap-2">
              <span>Hello, {profile.name ? profile.name.split(" ")[0] : "Aditi"}</span>
              <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Here's your scheme journey at a glance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/schemes"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
            >
              <span>Explore Top Matches</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((st) => (
            <div
              key={st.label}
              className={`p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-card flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{st.label}</span>
                {st.icon && <st.icon className={`w-4 h-4 ${st.color}`} />}
              </div>
              <div className={`text-2xl sm:text-3xl font-black mt-3 ${st.color}`}>
                {st.value}
              </div>
            </div>
          ))}
        </div>

        {/* Middle Section: Top 3 Opportunities & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top 3 Opportunities (8 cols) */}
          <div className="lg:col-span-7 p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
                Top 3 Opportunities
              </h2>
              <Link href="/schemes" className="text-xs font-bold text-brand-blue hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {topOpportunities.map((opp, idx) => (
                <Link
                  key={opp.id}
                  href={`/schemes/${opp.id}`}
                  className="p-3.5 rounded-xl border border-brand-border hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-brand-navy group-hover:text-brand-blue transition">
                        {opp.name}
                      </h3>
                      <p className="text-[11px] font-semibold text-emerald-600">
                        {opp.match}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${opp.badgeColor}`}>
                      {opp.priority}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
            <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((qa) => {
                const Icon = qa.icon;
                return (
                  <Link
                    key={qa.title}
                    href={qa.href}
                    className="p-3.5 rounded-xl border border-brand-border bg-slate-50/50 hover:bg-white hover:border-brand-blue hover:shadow-card transition flex flex-col justify-between group"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${qa.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-brand-navy group-hover:text-brand-blue transition">
                      {qa.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section: Category Distribution & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scheme Category Distribution (7 cols) */}
          <div className="lg:col-span-7 p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
            <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
              Scheme Category Distribution
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
              <div className="w-48 h-48 relative">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demoCategoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {demoCategoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend List */}
              <div className="space-y-2.5 w-full sm:w-auto">
                {demoCategoryDistribution.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between sm:justify-start gap-8 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.fill }}></span>
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-extrabold text-brand-navy">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-white rounded-2xl border border-brand-border shadow-card space-y-4">
            <h2 className="text-base sm:text-lg font-extrabold text-brand-navy">
              Recent Activity
            </h2>

            <div className="space-y-3.5">
              {demoRecentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-brand-navy">
                      {act.title}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {act.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Screen 11: Navigation and Features embedded on the page as well */}
        <div className="pt-6">
          <h3 className="text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
            Quick Navigation Bar
          </h3>
          <div className="w-full flex justify-center">
            {/* Renders BottomNavigation cards */}
            <div className="w-full">
              {/* BottomNavigation can be directly used */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
