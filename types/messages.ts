import type { Message } from "@/types/recruiter";

export type PeerProfile = {
  name: string | null;
  avatar_url: string | null;
};

export type MessagesListResponse = {
  messages: Message[];
  peer_profiles: Record<string, PeerProfile>;
  /** True when more rows exist before the oldest item in this response (use `next_before` with GET `before=`). */
  has_more?: boolean;
  /** ISO timestamp of the oldest message in this page — pass as `before` to load older messages. */
  next_before?: string | null;
  /** Present when the API may return a subset of all messages (pagination). */
  partial?: boolean;
};
