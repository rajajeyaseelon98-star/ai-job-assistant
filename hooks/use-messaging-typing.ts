"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Ephemeral “peer is typing” via Supabase Realtime broadcast on a deterministic channel name.
 * Degrades silently if Realtime is unavailable.
 */
export function useMessagingTyping(peerId: string | null, myId: string | undefined) {
  const [peerTyping, setPeerTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!peerId || !myId) {
      setPeerTyping(false);
      return;
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const supabase = createClient();
    const room = `typing:${[peerId, myId].sort().join(":")}`;
    const ch = supabase.channel(room, {
      config: { broadcast: { self: true } },
    });

    ch.on("broadcast", { event: "typing" }, (msg: { payload?: { userId?: string; active?: boolean } }) => {
      const p = msg.payload;
      if (!p || p.userId === myId) return;
      setPeerTyping(!!p.active);
    }).subscribe();

    channelRef.current = ch;

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      void ch.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: myId, active: false },
      });
      channelRef.current = null;
      setPeerTyping(false);
      void supabase.removeChannel(ch);
    };
  }, [peerId, myId]);

  const sendTyping = useCallback(
    async (active: boolean) => {
      const ch = channelRef.current;
      if (!ch || !myId) return;
      try {
        await ch.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: myId, active },
        });
      } catch {
        /* ignore */
      }
    },
    [myId]
  );

  const onTypingActivity = useCallback(() => {
    void sendTyping(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      void sendTyping(false);
      idleTimerRef.current = null;
    }, 2800);
  }, [sendTyping]);

  return { peerTyping, onTypingActivity, sendTyping };
}
