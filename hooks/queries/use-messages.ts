"use client";

import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { createClient } from "@/lib/supabase/client";
import { recruiterKeys } from "./recruiter-keys";
import type { Message } from "@/types/recruiter";
import type { MessagesListResponse, PeerProfile } from "@/types/messages";
import { useUser } from "./use-user";

const PAGE_LIMIT = 100;

export function useMessages(opts?: { unread?: boolean }) {
  const filter = opts?.unread ? "unread" : "all";
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const infinite = useInfiniteQuery({
    queryKey: [...recruiterKeys.messagesList(filter), "infinite"] as const,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_LIMIT));
      if (opts?.unread) params.set("unread", "true");
      if (pageParam) params.set("before", pageParam);
      const raw = await apiFetch<Message[] | MessagesListResponse>(`/api/messages?${params.toString()}`);
      if (Array.isArray(raw)) {
        return {
          messages: raw,
          peer_profiles: {},
          has_more: false,
          next_before: null,
          partial: false,
        } satisfies MessagesListResponse;
      }
      return {
        messages: raw.messages ?? [],
        peer_profiles: raw.peer_profiles ?? {},
        has_more: raw.has_more,
        next_before: raw.next_before ?? null,
        partial: raw.partial,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.next_before ? lastPage.next_before : undefined,
    staleTime: 30 * 1000,
  });

  const data = useMemo(() => {
    const pages = infinite.data?.pages ?? [];
    const messages = pages.flatMap((p) => p.messages);
    const peer_profiles = pages.reduce<Record<string, PeerProfile>>((acc, p) => {
      Object.assign(acc, p.peer_profiles);
      return acc;
    }, {});
    const last = pages[pages.length - 1];
    return {
      messages,
      peer_profiles,
      has_more: last?.has_more ?? false,
      partial: pages.some((p) => p.partial),
    };
  }, [infinite.data]);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const supabase = createClient();

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: recruiterKeys.messages() });
      void queryClient.invalidateQueries({ queryKey: recruiterKeys.unreadSummary() });
    };

    const channel = supabase
      .channel(`messages-realtime:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${uid}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${uid}`,
        },
        invalidate
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" && process.env.NODE_ENV === "development") {
          console.warn("[messages-realtime] subscription channel error — check Realtime enabled for public.messages");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    data,
    isLoading: infinite.isLoading,
    isFetching: infinite.isFetching,
    isFetchingNextPage: infinite.isFetchingNextPage,
    hasNextPage: infinite.hasNextPage,
    fetchNextPage: infinite.fetchNextPage,
    error: infinite.error,
    refetch: infinite.refetch,
  };
}
