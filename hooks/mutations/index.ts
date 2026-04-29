/** Barrel for shared TanStack mutations (see `docs/KNOWLEDGE_TRANSFER.md` §6.4). */
export { useUploadResume } from "./use-upload-resume";
export { useAnalyzeResume } from "./use-analyze-resume";
export { useImproveResume } from "./use-improve-resume";
export { useImportLinkedIn } from "./use-import-linkedin";
export { useAutoJobsSearch } from "./use-auto-jobs";
export { useJobMatch } from "./use-job-match";
export { useGenerateCoverLetter } from "./use-generate-cover-letter";
export {
  useCoverLetterContent,
  usePatchCoverLetter,
  useDeleteCoverLetter,
} from "./use-cover-letter-crud";
export {
  useSalaryIntelligenceSearch,
  type SalaryInsight,
} from "./use-salary-intelligence";
export { useInterviewPrep } from "./use-interview-prep";
export { useDevPlanPatch } from "./use-dev-plan";
export { useSubmitFeedback } from "./use-feedback";
export { usePublicExtractResume, usePublicFresherResume } from "./use-public-landing";
export { useHiringPrediction, type HiringPredictionBody } from "./use-hiring-prediction";
