import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Settings</h1>

      <section className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-text">Profile</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-text-muted">Email</dt>
            <dd className="font-medium text-text">{user.profile?.email ?? user.email}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Plan</dt>
            <dd className="font-medium text-text capitalize">{user.profile?.plan_type ?? "free"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-text">Subscription</h2>
        <p className="mt-2 text-sm text-text-muted">
          Manage your plan and billing. Pro plan is ₹199/month with unlimited usage.
        </p>
        <a
          href="/pricing"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          View pricing →
        </a>
      </section>
    </div>
  );
}
