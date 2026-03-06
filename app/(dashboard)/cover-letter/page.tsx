"use client";

import { useState } from "react";
import { CoverLetterForm } from "@/components/cover-letter/CoverLetterForm";
import { CoverLetterResult } from "@/components/cover-letter/CoverLetterResult";

export default function CoverLetterPage() {
  const [generated, setGenerated] = useState("");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Cover Letter Generator</h1>
      <p className="text-text-muted">
        Enter company, role, job description, and your resume to generate a professional cover letter.
      </p>

      <section className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text">Generate cover letter</h2>
        <CoverLetterForm onGenerated={setGenerated} />
      </section>

      {generated && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text">Generated cover letter</h2>
          <CoverLetterResult text={generated} />
        </section>
      )}
    </div>
  );
}
