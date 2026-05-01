"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ProfileCompletionBanner } from "./ProfileCompletionBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-[240px]">
        <Topbar />
        <ProfileCompletionBanner />
        <main className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
