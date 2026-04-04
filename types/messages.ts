import type { Message } from "@/types/recruiter";

export type PeerProfile = {
  name: string | null;
  avatar_url: string | null;
};

export type MessagesListResponse = {
  messages: Message[];
  peer_profiles: Record<string, PeerProfile>;
};
