#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readJson(pathParts) {
  const p = join(process.cwd(), ...pathParts);
  return JSON.parse(readFileSync(p, "utf-8"));
}

function main() {
  const users = readJson(["fixtures", "users.json"]);
  const job = readJson(["fixtures", "jobs", "sample-job-posting.json"]);
  const resumeText = readFileSync(join(process.cwd(), "fixtures", "resumes", "sample-resume.txt"), "utf-8");

  // This script intentionally emits SQL statements to keep test data setup explicit.
  const sql = `
-- Run these statements in Supabase SQL editor for deterministic E2E/API tests.
-- Users should already exist in auth.users; this seeds app-level profile data only.
insert into public.users (id, email, full_name, role)
values
  ('${users.jobSeeker.id}', '${users.jobSeeker.email}', '${users.jobSeeker.name}', 'job_seeker'),
  ('${users.recruiter.id}', '${users.recruiter.email}', '${users.recruiter.name}', 'recruiter')
on conflict (id) do update
set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

insert into public.job_postings (
  id, recruiter_id, title, description, requirements, skills_required, location, work_type, employment_type,
  salary_min, salary_max, salary_currency, status
)
values (
  '${job.id}', '${users.recruiter.id}', '${job.title}', '${job.description}', '${job.requirements}',
  '${JSON.stringify(job.skills_required)}'::jsonb, '${job.location}', '${job.work_type}', '${job.employment_type}',
  ${job.salary_min}, ${job.salary_max}, '${job.salary_currency}', '${job.status}'
)
on conflict (id) do update
set title = excluded.title, description = excluded.description, requirements = excluded.requirements, status = excluded.status;

-- Optional sample resume row for seeded tests.
-- Replace target table/columns if your schema differs.
-- insert into public.resumes (id, user_id, parsed_text) values
-- ('00000000-0000-4000-8000-00000000dd01', '${users.jobSeeker.id}', $$${resumeText.replace(/\$/g, "\\$")}$$)
-- on conflict (id) do update set parsed_text = excluded.parsed_text;
`;

  process.stdout.write(sql.trimStart());
}

main();
