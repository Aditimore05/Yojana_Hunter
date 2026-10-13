import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

export const metadata: Metadata = {
  title: "Yojana Hunter — Your Government Scheme Guide",
  description: "Beyond Searching Schemes, Getting Citizens the Benefits They Deserve. AI-Powered scheme discovery, eligibility verification & guided application preparation.",
  icons: {
    icon: "/images/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-brand-bg text-brand-navy antialiased selection:bg-blue-100 selection:text-brand-blue">
        <AuthProvider>
          <AppHeader />
          <div className="flex-1 flex flex-col pb-6">
            {children}
          </div>
          {/* Screen 11: Navigation & Features */}
          <div className="w-full pb-4 px-2">
            <BottomNavigation />
          </div>
          <Footer />
          {/* Screen 12: Chatbot Widget */}
          <ChatbotWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
