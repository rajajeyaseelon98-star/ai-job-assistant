export const recruiterKeys = {
  all: ["recruiter"] as const,
  jobs: () => [...recruiterKeys.all, "jobs"] as const,
  job: (id: string) => [...recruiterKeys.all, "jobs", id] as const,
  candidateDetail: (id: string) => [...recruiterKeys.all, "candidate", id] as const,
  applications: () => [...recruiterKeys.all, "applications"] as const,
  messages: () => [...recruiterKeys.all, "messages"] as const,
  /** Matches useMessages: ["recruiter","messages","all"|"unread"] */
  messagesList: (filter: "all" | "unread" = "all") =>
    [...recruiterKeys.messages(), filter] as const,
  /** Full thread with one peer: ["recruiter","messages","thread", peerId] */
  threadMessages: (peerId: string) => [...recruiterKeys.messages(), "thread", peerId] as const,
  /** Per-peer unread counts: ["recruiter","messages","unread-summary"] */
  unreadSummary: () => [...recruiterKeys.messages(), "unread-summary"] as const,
  alerts: () => [...recruiterKeys.all, "alerts"] as const,
  templates: () => [...recruiterKeys.all, "templates"] as const,
  company: () => [...recruiterKeys.all, "company"] as const,
  topCandidates: (params?: string) => [...recruiterKeys.all, "top-candidates", params ?? ""] as const,
  user: () => [...recruiterKeys.all, "user"] as const,
};
