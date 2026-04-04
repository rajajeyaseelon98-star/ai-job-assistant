"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { createClient } from "@/lib/supabase/client";
import { recruiterKeys } from "./recruiter-keys";
import type { Message } from "@/types/recruiter";
import type { MessagesListResponse } from "@/types/messages";
import { useUser } from "./use-user";

export function useMessages(opts?: { unread?: boolean }) {
  const url = opts?.unread ? "/api/messages?unread=true" : "/api/messages";
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const query = useQuery({
    queryKey: recruiterKeys.messagesList(opts?.unread ? "unread" : "all"),
    queryFn: async () => {
      const raw = await apiFetch<Message[] | MessagesListResponse>(url);
      if (Array.isArray(raw)) {
        return { messages: raw, peer_profiles: {} } satisfies MessagesListResponse;
      }
      return {
        messages: raw.messages ?? [],
        peer_profiles: raw.peer_profiles ?? {},
      };
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const supabase = createClient();

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: recruiterKeys.messages() });
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

  return query;
}
