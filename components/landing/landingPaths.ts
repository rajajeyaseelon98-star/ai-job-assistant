/** Signup URLs used across the marketing landing (single source of truth). */
export const JOB_SEEKER_SIGNUP = `/signup?role=job_seeker&next=${encodeURIComponent("/resume-analyzer")}`;
export const RECRUITER_SIGNUP = `/signup?role=recruiter&next=${encodeURIComponent("/recruiter/jobs/new")}`;
