"use client";

import type { ExtractedSkills } from "@/types/jobFinder";
import { Code, Heart, Wrench, Briefcase, Building2 } from "lucide-react";

interface SkillsOverviewProps {
  skills: ExtractedSkills;
}

export function SkillsOverview({ skills }: SkillsOverviewProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-text">Extracted Profile</h3>

      <div className="mb-3 flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-text">Experience Level:</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
          {skills.experience_level || "Unknown"}
        </span>
      </div>

      {skills.preferred_roles.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-text">Best-fit Roles</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.preferred_roles.map((role) => (
              <span key={role} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.technical.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 flex items-center gap-2">
            <Code className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-text">Technical Skills</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.technical.map((skill) => (
              <span key={skill} className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.tools.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-text">Tools & Platforms</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.tools.map((tool) => (
              <span key={tool} className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.soft.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium text-text">Soft Skills</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.soft.map((skill) => (
              <span key={skill} className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs text-pink-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.industries.length > 0 && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-text">Industries</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.industries.map((ind) => (
              <span key={ind} className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs text-purple-700">
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
