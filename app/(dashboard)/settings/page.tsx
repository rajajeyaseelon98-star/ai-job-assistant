import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, plan_type")
    .eq("id", user.id)
    .single();
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("experience_level, preferred_role, preferred_location, salary_expectation")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-5 md:space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
      <p className="text-slate-500 text-base mt-2">Manage your profile, preferences, and account settings.</p>

      <SettingsForm
        name={profile?.name ?? ""}
        email={profile?.email ?? user.email ?? ""}
        planType={profile?.plan_type ?? "free"}
        experienceLevel={prefs?.experience_level ?? ""}
        preferredRole={prefs?.preferred_role ?? ""}
        preferredLocation={prefs?.preferred_location ?? ""}
        salaryExpectation={prefs?.salary_expectation ?? ""}
      />
    </div>
  );
}
