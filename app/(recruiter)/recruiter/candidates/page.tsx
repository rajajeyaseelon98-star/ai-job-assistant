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
    <div className="max-w-5xl mx-auto w-full py-12 px-6">
      <h1 className="font-display text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Candidate Search</h1>
      <p className="text-slate-500 text-lg mb-10 max-w-2xl">Search our resume database to find matching candidates.</p>

      <form onSubmit={handleSearch} className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[32px] p-8 sm:p-10 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-6">
          <div className="lg:col-span-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Skills</label>
            <input
              type="text" value={skills} onChange={(e) => setSkills(e.target.value)}
              placeholder="React, Node.js, Python..."
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Experience Level</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none">
              <option value="">Any</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div className="lg:col-span-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
            <input
              type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Chennai, Remote..."
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none"
            />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 rounded-2xl py-4 font-bold transition-all flex items-center justify-center gap-2 mt-6 lg:mt-0 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search Candidates
        </button>
      </form>

      <div className="border-t border-slate-100 pt-12">
        <h2 className="font-display text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          {searched ? `${results.length} Candidates Found` : "Results"}
        </h2>
        {results.length === 0 ? (
          <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] py-32 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white text-slate-200 rounded-3xl flex items-center justify-center shadow-sm mb-6">
              <User className="h-9 w-9" />
            </div>
            <p className="font-display text-slate-400 font-medium text-lg">
              {searched ? "No candidates found" : "Search to discover candidates"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {searched ? "No candidates match your current filters." : "Use skills, experience, and location filters to begin."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 hover:shadow-md transition-all flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-50 text-slate-400 w-12 h-12 rounded-xl flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{c.name || c.email}</h3>
                        {c.name && <p className="text-xs text-slate-500">{c.email}</p>}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
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
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">{c.resume_preview}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.preferred_role && (
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded">{c.preferred_role}</span>
                    )}
                    {c.experience_level && (
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded">{c.experience_level}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
