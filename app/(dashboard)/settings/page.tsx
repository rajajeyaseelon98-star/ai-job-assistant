"use client";

import { useUser } from "@/hooks/queries/use-user";
import { SettingsForm } from "./SettingsForm";
import { PageLoading } from "@/components/ui/PageLoading";

export default function SettingsPage() {
  const { data: user, isLoading, error } = useUser();

  if (isLoading) return <PageLoading titleWidth="w-32" />;
  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto w-full py-8">
        <p className="text-sm text-red-600">Failed to load settings. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-5 md:space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
      <p className="text-slate-500 text-base mt-2">Manage your profile, preferences, and account settings.</p>

      <SettingsForm
        name={user.name ?? ""}
        email={user.email ?? ""}
        planType={user.plan_type ?? "free"}
        experienceLevel={user.preferences?.experience_level ?? ""}
        preferredRole={user.preferences?.preferred_role ?? ""}
        preferredLocation={user.preferences?.preferred_location ?? ""}
        salaryExpectation={user.preferences?.salary_expectation ?? ""}
      />
    </div>
  );
}
