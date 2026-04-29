"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { recruiterKeys } from "@/hooks/queries/recruiter-keys";

/**
 * After mark-read, broadcast so the peer invalidates thread/inbox without relying only on
 * postgres_changes UPDATE (which can miss read_at updates when replica identity is narrow).
 */
export function useMessagingReadSync(peerId: string | null, myId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!peerId || !myId) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const supabase = createClient();
    const room = `msg-read:${[peerId, myId].sort().join(":")}`;
    const ch = supabase.channel(room, { config: { broadcast: { self: true } } });

    ch.on(
      "broadcast",
      { event: "read" },
      (msg: { payload?: { userId?: string } }) => {
        const uid = msg.payload?.userId;
        if (uid && uid !== myId) {
          void queryClient.invalidateQueries({
            queryKey: recruiterKeys.threadMessages(peerId),
            refetchType: "all",
          });
          void queryClient.invalidateQueries({ queryKey: recruiterKeys.messages(), refetchType: "all" });
          void queryClient.invalidateQueries({ queryKey: recruiterKeys.unreadSummary(), refetchType: "all" });
        }
      }
    ).subscribe();

    channelRef.current = ch;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(ch);
    };
  }, [peerId, myId, queryClient]);

  const notifyPeerRead = useCallback(async () => {
    const ch = channelRef.current;
    if (!ch || !myId) return;
    const msg = {
      type: "broadcast" as const,
      event: "read" as const,
      payload: { userId: myId },
    };
    const send = async () => {
      try {
        await ch.send(msg);
      } catch {
        /* ignore */
      }
    };
    await send();
    await new Promise((r) => setTimeout(r, 400));
    await send();
  }, [myId]);

  return { notifyPeerRead };
}
