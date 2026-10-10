import React from "react";

export const metadata = {
  title: "Yojana Hunter — AI-Powered Government Scheme Platform",
  description: "Beyond Searching Schemes, Getting Citizens the Benefits They Deserve",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">{children}</body>
    </html>
  );
}
