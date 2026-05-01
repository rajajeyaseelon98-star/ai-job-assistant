"use client";

import type { ExtractedSkills } from "@/types/jobFinder";
import { Code, Heart, Wrench, Briefcase, Building2 } from "lucide-react";

interface SkillsOverviewProps {
  skills: ExtractedSkills;
}

export function SkillsOverview({ skills }: SkillsOverviewProps) {
  return (
    <div className="mb-12 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      <h3 className="mb-6 font-display text-xl font-bold text-text">Extracted Profile</h3>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Briefcase className="h-4 w-4 text-text-muted shrink-0" />
        <span className="text-sm font-semibold text-text">Experience Level:</span>
        <span className="inline-block mr-2 mb-2 rounded-md border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-medium capitalize text-violet-700">
          {skills.experience_level || "Unknown"}
        </span>
      </div>

      {skills.preferred_roles.length > 0 && (
        <div className="mb-3">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-semibold text-text">Best-fit Roles</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {skills.preferred_roles.map((role) => (
              <span key={role} className="inline-block mr-2 mb-2 rounded-md border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.technical.length > 0 && (
        <div className="mb-3">
          <div className="mb-3 flex items-center gap-2">
            <Code className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-semibold text-text">Technical Skills</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {skills.technical.map((skill) => (
              <span key={skill} className="inline-block mr-2 mb-2 rounded-md border border-primary/15 bg-surface-muted px-3 py-1 text-xs font-medium text-primary">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.tools.length > 0 && (
        <div className="mb-3">
          <div className="mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-semibold text-text">Tools & Platforms</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {skills.tools.map((tool) => (
              <span key={tool} className="inline-block mr-2 mb-2 rounded-md border border-primary/15 bg-surface-muted px-3 py-1 text-xs font-medium text-primary">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.soft.length > 0 && (
        <div className="mb-3">
          <div className="mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-semibold text-text">Soft Skills</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {skills.soft.map((skill) => (
              <span key={skill} className="inline-block mr-2 mb-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.industries.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-semibold text-text">Industries</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {skills.industries.map((ind) => (
              <span key={ind} className="inline-block mr-2 mb-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
