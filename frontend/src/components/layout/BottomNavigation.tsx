"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Layers, 
  User, 
  Bookmark, 
  FileText, 
  Settings, 
  Sparkles, 
  LogIn, 
  UserCheck 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // When authenticated: show Dashboard, Start Now, Schemes, My Profile, My Schemes, Applications (6 items)
  // When unauthenticated: strictly show Home, Sign In, Register (3 items - Schemes and Start Now are completely hidden)
  const navItems = isAuthenticated
    ? [
        {
          name: "Dashboard",
          label: "Dashboard",
          href: "/dashboard",
          icon: Home,
          isActive: pathname === "/dashboard",
        },
        {
          name: "Start Now",
          label: "Start Now",
          href: "/onboarding",
          icon: Sparkles,
          isActive: pathname === "/onboarding" || pathname === "/interview",
        },
        {
          name: "Schemes",
          label: "Schemes",
          href: "/schemes",
          icon: Layers,
          isActive: pathname.startsWith("/schemes"),
        },
        {
          name: "My Profile",
          label: "My Profile",
          href: "/profile",
          icon: User,
          isActive: pathname === "/profile",
        },
        {
          name: "My Schemes",
          label: "My Schemes",
          href: "/saved-schemes",
          icon: Bookmark,
          isActive: pathname === "/saved-schemes",
        },
        {
          name: "Applications",
          label: "Applications",
          href: "/applications",
          icon: FileText,
          isActive: pathname === "/applications" || pathname === "/application-draft",
        },
      ]
    : [
        {
          name: "Home",
          label: "Home",
          href: "/",
          icon: Home,
          isActive: pathname === "/",
        },
        {
          name: "Sign In",
          label: "Sign In",
          href: "/login",
          icon: LogIn,
          isActive: pathname === "/login",
        },
        {
          name: "Register",
          label: "Register",
          href: "/register",
          icon: UserCheck,
          isActive: pathname === "/register",
        },
      ];

  const gridClass = isAuthenticated ? "grid-cols-6" : "grid-cols-3";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3">
      <nav
        aria-label="Bottom Navigation"
        className={`grid ${gridClass} gap-2 sm:gap-4 p-2 sm:p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-brand-border shadow-floating`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition group text-center ${
                item.isActive
                  ? "bg-blue-50 text-brand-blue font-bold shadow-xs"
                  : "text-slate-600 hover:text-brand-navy hover:bg-slate-50 font-medium"
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition ${
                  item.isActive
                    ? "bg-brand-blue text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="mt-1.5 text-[11px] sm:text-xs leading-tight whitespace-pre-line">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
