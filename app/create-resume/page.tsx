import Link from "next/link";
import { CreateResumeFresherFlow } from "@/components/landing/CreateResumeFresherFlow";

export const metadata = {
  title: "Create resume with AI | AI Job Assistant",
  description: "Answer a few questions — get a professional, ATS-friendly resume in seconds.",
};

export default function CreateResumePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold text-primary">
            AI Job Assistant
          </Link>
          <Link href="/" className="text-sm text-text-muted hover:text-foreground">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-primary">
          We don&apos;t just help you find jobs — we get you interviews automatically.
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          No resume? Create one in 60 seconds
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-text-muted sm:text-base">
          Answer a few simple questions and our AI will build a professional resume for you.
        </p>

        <div className="mt-8 sm:mt-10">
          <CreateResumeFresherFlow />
        </div>
      </main>
    </div>
  );
}
