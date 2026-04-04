"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RecruiterSidebar } from "./RecruiterSidebar";
import { RecruiterTopbar } from "./RecruiterTopbar";
import { ProfileCompletionBanner } from "./ProfileCompletionBanner";
import { useRecruiterUser } from "@/hooks/queries/use-recruiter";
import { PageLoading } from "@/components/ui/PageLoading";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: userData, isLoading, isFetching } = useRecruiterUser();
  const user = userData as Record<string, unknown> | undefined;
  const role = user?.role as string | undefined;
  const userName = (user?.name as string) || (user?.email as string) || "";
  const avatarUrl = (user?.avatar_url as string | null | undefined) ?? null;
  const uid = (user?.id as string | undefined) ?? undefined;

  useEffect(() => {
    if (isLoading || isFetching) return;
    if (!user || role !== "recruiter") {
      router.replace("/select-role?next=/recruiter");
    }
  }, [isLoading, isFetching, user, role, router]);

  if (isLoading) return <PageLoading titleWidth="w-48" />;
  // Effect waits for !isFetching before redirect so a stale cached role can refresh after switching.
  if (!user || role !== "recruiter") return <PageLoading titleWidth="w-48" />;

  return (
    <div className="min-h-screen bg-background">
      <RecruiterSidebar />
      <div className="lg:pl-[240px]">
        <RecruiterTopbar userName={userName} avatarUrl={avatarUrl} userId={uid} />
        <ProfileCompletionBanner />
        <main className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
