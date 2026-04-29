"use client";

import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { createClient } from "@/lib/supabase/client";
import { recruiterKeys } from "./recruiter-keys";
import type { Message } from "@/types/recruiter";
import type { PeerProfile } from "@/types/messages";
import { useUser } from "./use-user";

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
  const queryClient = useQueryClient();
  const { data: user } = useUser();

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
    /** Fallback when Realtime is off or `messages` is not in the Supabase publication — still pick up new messages. */
    refetchInterval: enabled && peerId ? 12_000 : false,
    refetchIntervalInBackground: true,
  });

  // Second realtime path for the open thread (narrow filters) + refetchInterval fallback if Realtime is off.
  useEffect(() => {
    const uid = user?.id;
    if (!peerId || !uid || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const supabase = createClient();
    const invalidateThread = () => {
      void queryClient.invalidateQueries({
        queryKey: recruiterKeys.threadMessages(peerId),
        refetchType: "all",
      });
      void queryClient.invalidateQueries({ queryKey: recruiterKeys.unreadSummary(), refetchType: "all" });
    };

    const isThisThread = (row: { sender_id?: string; receiver_id?: string }) =>
      (row.sender_id === uid && row.receiver_id === peerId) ||
      (row.sender_id === peerId && row.receiver_id === uid);

    const channel = supabase
      .channel(`messages-thread:${uid}:${peerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${peerId}` },
        (payload) => {
          const row = payload.new as { sender_id?: string; receiver_id?: string };
          if (isThisThread(row)) invalidateThread();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${peerId}` },
        (payload) => {
          const row = payload.new as { sender_id?: string; receiver_id?: string };
          if (isThisThread(row)) invalidateThread();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `sender_id=eq.${peerId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { sender_id?: string; receiver_id?: string };
          if (isThisThread(row)) invalidateThread();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${peerId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { sender_id?: string; receiver_id?: string };
          if (isThisThread(row)) invalidateThread();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, peerId, queryClient]);

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
