import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getUsageSummary } from "@/lib/usage";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=" + encodeURIComponent("/dashboard"));
  }

  const planType = user.profile?.plan_type ?? "free";
  const usage = await getUsageSummary(user.id, planType);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-[240px]">
        <Topbar planType={planType} usage={usage} />
        <main className="bg-slate-50 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
