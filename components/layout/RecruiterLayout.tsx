import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { RecruiterSidebar } from "./RecruiterSidebar";
import { RecruiterTopbar } from "./RecruiterTopbar";

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=" + encodeURIComponent("/recruiter"));
  }

  // If user hasn't set role to recruiter, redirect to role selection
  if (user.profile?.role !== "recruiter") {
    redirect("/select-role?next=/recruiter");
  }

  return (
    <div className="min-h-screen bg-background">
      <RecruiterSidebar />
      <div className="lg:pl-[240px]">
        <RecruiterTopbar userName={user.profile?.name || user.email} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
