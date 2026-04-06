"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { recruiterKeys } from "./recruiter-keys";
import type { Message } from "@/types/recruiter";
import type { PeerProfile } from "@/types/messages";

export type ThreadApiResponse = {
  messages: Message[];
  peer_profiles: Record<string, PeerProfile>;
  has_more: boolean;
  next_before: string | null;
  peer_id: string;
};

const PAGE = 100;

export function useThreadMessages(peerId: string | null) {
  const enabled = Boolean(peerId);

  const infinite = useInfiniteQuery({
    queryKey: enabled && peerId ? recruiterKeys.threadMessages(peerId) : ["recruiter", "messages", "thread", "disabled"],
    enabled: enabled && !!peerId,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      params.set("peer_id", peerId!);
      params.set("limit", String(PAGE));
      if (pageParam) params.set("before", pageParam);
      return apiFetch<ThreadApiResponse>(`/api/messages/thread?${params.toString()}`);
    },
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.next_before ? lastPage.next_before : undefined,
    staleTime: 15 * 1000,
  });

  const merged = useMemo(() => {
    const pages = infinite.data?.pages ?? [];
    const byId = new Map<string, Message>();
    for (const p of pages) {
      for (const m of p.messages) {
        byId.set(m.id, m);
      }
    }
    const chronological = Array.from(byId.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const peer_profiles = pages.reduce<Record<string, PeerProfile>>((acc, p) => {
      Object.assign(acc, p.peer_profiles);
      return acc;
    }, {});
    const last = pages[pages.length - 1];
    return {
      messages: chronological,
      peer_profiles,
      has_more_thread: last?.has_more ?? false,
    };
  }, [infinite.data?.pages]);

  return {
    ...merged,
    isLoading: infinite.isLoading,
    isFetchingNextPage: infinite.isFetchingNextPage,
    hasNextPage: infinite.hasNextPage,
    fetchNextPage: infinite.fetchNextPage,
    error: infinite.error,
    refetch: infinite.refetch,
  };
}
