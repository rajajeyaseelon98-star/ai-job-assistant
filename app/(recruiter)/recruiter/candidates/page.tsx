"use client";

import { useState } from "react";
import { Search, Loader2, User, MapPin, Briefcase } from "lucide-react";

interface CandidateResult {
  id: string;
  email: string;
  name: string | null;
  resume_preview: string | null;
  experience_level: string | null;
  preferred_role: string | null;
  preferred_location: string | null;
  salary_expectation: string | null;
}

export default function CandidateSearchPage() {
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (skills.trim()) params.set("skills", skills.trim());
      if (experience) params.set("experience", experience);
      if (location.trim()) params.set("location", location.trim());

      const res = await fetch(`/api/recruiter/candidates?${params.toString()}`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">Candidate Search</h1>
      <p className="text-sm text-text-muted sm:text-base">Search our resume database to find matching candidates.</p>

      <form onSubmit={handleSearch} className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 shadow-sm space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Skills</label>
            <input
              type="text" value={skills} onChange={(e) => setSkills(e.target.value)}
              placeholder="React, Node.js, Python..."
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Experience Level</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]">
              <option value="">Any</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Location</label>
            <input
              type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Chennai, Remote..."
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 min-h-[44px] w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search Candidates
        </button>
      </form>

      {searched && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-text">{results.length} Candidates Found</h2>
          {results.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">No candidates match your search criteria.</p>
          ) : (
            <div className="space-y-3">
              {results.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text">{c.name || c.email}</h3>
                          {c.name && <p className="text-xs text-text-muted">{c.email}</p>}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
                        {c.experience_level && (
                          <span className="flex items-center gap-1 capitalize">
                            <Briefcase className="h-3 w-3" /> {c.experience_level}
                          </span>
                        )}
                        {c.preferred_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {c.preferred_location}
                          </span>
                        )}
                        {c.preferred_role && <span>Wants: {c.preferred_role}</span>}
                        {c.salary_expectation && <span>Salary: {c.salary_expectation}</span>}
                      </div>
                      {c.resume_preview && (
                        <p className="mt-2 text-xs text-text-muted line-clamp-2">{c.resume_preview}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
