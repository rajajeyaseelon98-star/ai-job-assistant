"use client";

import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { recruiterKeys } from "./recruiter-keys";
import { useUser } from "./use-user";

type ChannelEntry = { channel: RealtimeChannel; supabase: ReturnType<typeof createClient>; refs: number };

// Prevent duplicate subscriptions when Topbar + Sidebar both mount unread state.
const byUserId = new Map<string, ChannelEntry>();

export function useMessageUnreadRealtime() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;

    const existing = byUserId.get(uid);
    if (existing) {
      existing.refs += 1;
      return () => {
        const cur = byUserId.get(uid);
        if (!cur) return;
        cur.refs -= 1;
        if (cur.refs <= 0) {
          byUserId.delete(uid);
          // Remove using the same client instance that created it.
          void cur.supabase.removeChannel(cur.channel);
        }
      };
    }

    const supabase = createClient();
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: recruiterKeys.unreadSummary(), refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: recruiterKeys.messages(), refetchType: "all" });
    };

    const ch = supabase
      .channel(`messages-realtime:${uid}:unread`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${uid}` },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${uid}` },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${uid}` },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `sender_id=eq.${uid}` },
        invalidate
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" && process.env.NODE_ENV === "development") {
          console.warn(
            "[messages-unread-realtime] subscription channel error — check Realtime enabled for public.messages"
          );
        }
      });

    byUserId.set(uid, { channel: ch, supabase, refs: 1 });

    return () => {
      const cur = byUserId.get(uid);
      if (!cur) return;
      cur.refs -= 1;
      if (cur.refs <= 0) {
        byUserId.delete(uid);
        void supabase.removeChannel(ch);
      }
    };
  }, [user?.id, queryClient]);
}

