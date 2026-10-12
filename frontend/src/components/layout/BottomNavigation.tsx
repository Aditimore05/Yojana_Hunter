"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, User, FolderArchive, FileText, Settings } from "lucide-react";

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    {
      name: "Home\nDashboard",
      label: "Home / Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard" || pathname === "/",
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
      isActive: pathname === "/profile" || pathname === "/interview",
    },
    {
      name: "Documents",
      label: "Documents",
      href: "/documents",
      icon: FolderArchive,
      isActive: pathname === "/documents",
    },
    {
      name: "Applications",
      label: "Applications",
      href: "/applications",
      icon: FileText,
      isActive: pathname === "/applications" || pathname === "/action-plan" || pathname === "/application-draft",
    },
    {
      name: "Settings",
      label: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3">
      <nav
        aria-label="Bottom Navigation"
        className="grid grid-cols-6 gap-2 sm:gap-4 p-2 sm:p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-brand-border shadow-floating"
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
