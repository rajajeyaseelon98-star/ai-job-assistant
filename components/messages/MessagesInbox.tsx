"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, MessageSquare, Reply, Paperclip, X } from "lucide-react";
import type { Message } from "@/types/recruiter";
import type { PeerProfile } from "@/types/messages";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useMessages } from "@/hooks/queries/use-messages";
import { useThreadMessages } from "@/hooks/queries/use-thread-messages";
import { useMessageUnreadSummary } from "@/hooks/queries/use-message-unread-summary";
import { useSendMessage } from "@/hooks/queries/use-recruiter";
import { useUser } from "@/hooks/queries/use-user";
import { apiFetch, apiFetchMultipartJson } from "@/lib/api-fetcher";
import { RecipientPicker } from "@/components/messages/RecipientPicker";
import { recruiterKeys } from "@/hooks/queries/recruiter-keys";
import { useMessagingTyping } from "@/hooks/use-messaging-typing";
import { useMessagingReadSync } from "@/hooks/use-messaging-read-sync";
import { MessageDeliveryState } from "@/components/messages/MessageDeliveryState";
import { RealtimeHealthBadge } from "@/components/messages/RealtimeHealthBadge";
import { InlineRetryCard } from "@/components/ui/InlineRetryCard";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

function peerIdForMessage(m: Message, myId: string): string {
  return m.sender_id === myId ? m.receiver_id : m.sender_id;
}

function peerDisplayName(peerId: string, peerProfiles: Record<string, PeerProfile>): string {
  const n = peerProfiles[peerId]?.name?.trim();
  if (n) return n;
  return `…${peerId.slice(-8)}`;
}

type Conversation = {
  peerId: string;
  lastAt: string;
  preview: string;
  subject: string | null;
};

function buildConversations(messages: Message[], myId: string): Conversation[] {
  const seen = new Map<string, Conversation>();
  const chronological = [...messages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  for (const m of chronological) {
    const peer = peerIdForMessage(m, myId);
    if (!seen.has(peer)) {
      const preview =
        m.attachment_name?.trim() || m.attachment_path
          ? `Attachment${m.attachment_name ? `: ${m.attachment_name}` : ""}`
          : m.content.slice(0, 100);
      seen.set(peer, {
        peerId: peer,
        lastAt: m.created_at,
        preview,
        subject: m.subject,
      });
    }
  }
  return Array.from(seen.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );
}

export function MessagesInbox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: userData } = useUser();
  const myId = userData?.id ?? "";

  const {
    data: messagesRaw,
    isLoading: loading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages();
  const messages = useMemo(() => messagesRaw?.messages ?? [], [messagesRaw]);
  const peerProfiles = useMemo(
    () => messagesRaw?.peer_profiles ?? {},
    [messagesRaw]
  );
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const threadQuery = useThreadMessages(selectedPeerId);
  const { data: unreadSummary } = useMessageUnreadSummary();
  const unreadByPeer = unreadSummary?.counts ?? {};

  const sendMutation = useSendMessage();
  const { notifyPeerRead } = useMessagingReadSync(selectedPeerId, myId || undefined);

  const threadPeerProfiles = useMemo(
    () => ({ ...peerProfiles, ...threadQuery.peer_profiles }),
    [peerProfiles, threadQuery.peer_profiles]
  );

  const threadMessages = threadQuery.messages;
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const initialScrolledPeerRef = useRef<string | null>(null);
  const [nearBottom, setNearBottom] = useState(true);
  const [hasNewBelow, setHasNewBelow] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = bottomRef.current;
    if (!el) return;
    try {
      el.scrollIntoView({ block: "end", behavior });
    } catch {
      // ignore (older browsers / transient DOM)
    }
  }, []);

  const unreadInboundCount = useMemo(() => {
    if (!selectedPeerId || !myId) return 0;
    return threadMessages.filter(
      (m) => m.sender_id === selectedPeerId && m.receiver_id === myId && !m.is_read
    ).length;
  }, [threadMessages, selectedPeerId, myId]);

  const firstUnreadInboundId = useMemo(() => {
    if (!selectedPeerId || !myId) return null;
    const first = threadMessages.find(
      (m) => m.sender_id === selectedPeerId && m.receiver_id === myId && !m.is_read
    );
    return first?.id ?? null;
  }, [threadMessages, selectedPeerId, myId]);

  const [receiverId, setReceiverId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeAttachment, setComposeAttachment] = useState<{
    path: string;
    name: string;
    mime: string;
  } | null>(null);
  const [replyAttachment, setReplyAttachment] = useState<{
    path: string;
    name: string;
    mime: string;
  } | null>(null);
  const [uploadingComposeFile, setUploadingComposeFile] = useState(false);
  const [uploadingReplyFile, setUploadingReplyFile] = useState(false);
  const [deliveryState, setDeliveryState] = useState<"sending" | "sent" | "read" | "failed" | null>(null);
  const [deliveryDetail, setDeliveryDetail] = useState<string>("");
  const [realtimeConnected, setRealtimeConnected] = useState<boolean | null>(null);
  const composeFileRef = useRef<HTMLInputElement>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);

  const typingPeerId =
    showCompose && receiverId.trim() ? receiverId.trim() : selectedPeerId;
  const { peerTyping, onTypingActivity } = useMessagingTyping(typingPeerId, myId || undefined);

  const conversations = useMemo(() => {
    if (!myId) return [];
    return buildConversations(messages, myId);
  }, [messages, myId]);

  /** Deep link ?peer= may target someone not yet present in paginated inbox — still show a row. */
  const displayConversations = useMemo(() => {
    const peer = searchParams.get("peer")?.trim();
    if (!peer || !myId) return conversations;
    if (conversations.some((c) => c.peerId === peer)) return conversations;
    return [
      {
        peerId: peer,
        lastAt: new Date().toISOString(),
        preview: "Conversation",
        subject: null as string | null,
      },
      ...conversations,
    ];
  }, [conversations, searchParams, myId]);

  /** Deep links: ?peer= opens thread; ?compose=1&receiver_id= opens compose or existing thread (chat-app behavior). */
  useEffect(() => {
    const peer = searchParams.get("peer")?.trim();
    const compose = searchParams.get("compose") === "1";
    const rid = searchParams.get("receiver_id")?.trim() ?? "";

    if (peer) {
      setSelectedPeerId(peer);
      setShowCompose(false);
      return;
    }

    if (!compose) {
      setShowCompose(false);
      setSelectedPeerId(null);
      return;
    }

    if (rid) setReceiverId(rid);

    if (rid && (loading || !myId)) {
      setShowCompose(false);
      setSelectedPeerId(null);
      return;
    }

    if (rid && myId && messages.some((m) => peerIdForMessage(m, myId) === rid)) {
      setSelectedPeerId(rid);
      setShowCompose(false);
      router.replace(`${pathname}?peer=${encodeURIComponent(rid)}`, { scroll: false });
      return;
    }

    setShowCompose(true);
    setSelectedPeerId(null);
  }, [searchParams, loading, myId, messages, pathname, router]);

  const ridParam = searchParams.get("receiver_id")?.trim() ?? "";
  const resolvingComposeUrl =
    searchParams.get("compose") === "1" && !!ridParam && (loading || !myId);

  useEffect(() => {
    if (!selectedPeerId || !myId) return;
    if (unreadInboundCount <= 0) return;
    // Avoid marking read when mounted but not actually seen.
    if (typeof document !== "undefined") {
      if (document.visibilityState !== "visible") return;
      if (typeof document.hasFocus === "function" && !document.hasFocus()) return;
    }
    void apiFetch("/api/messages/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peer_id: selectedPeerId }),
    })
      .then(() => {
        // Optimistic: clear this peer in unread summary immediately so header/sidebar badges drop instantly.
        queryClient.setQueryData(recruiterKeys.unreadSummary(), (prev: unknown) => {
          if (!prev || typeof prev !== "object") return prev;
          const p = prev as { counts?: Record<string, number> };
          const counts = { ...(p.counts ?? {}) };
          counts[selectedPeerId] = 0;
          return { ...p, counts };
        });
        void queryClient.invalidateQueries({ queryKey: recruiterKeys.unreadSummary() });
        void queryClient.invalidateQueries({ queryKey: recruiterKeys.messages() });
        void queryClient.invalidateQueries({
          queryKey: recruiterKeys.threadMessages(selectedPeerId),
          refetchType: "all",
        });
        void notifyPeerRead();
      })
      .catch(() => {});
  }, [selectedPeerId, myId, unreadInboundCount, queryClient, notifyPeerRead]);

  // Scroll to latest on first open of a thread (instant).
  useEffect(() => {
    if (!selectedPeerId) return;
    if (threadQuery.isLoading) return;
    if (threadMessages.length === 0) return;
    if (initialScrolledPeerRef.current === selectedPeerId) return;
    initialScrolledPeerRef.current = selectedPeerId;
    setHasNewBelow(false);
    setNearBottom(true);
    scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeerId, threadQuery.isLoading, threadMessages.length]);

  // Detect incoming messages and apply conditional scroll policy.
  useEffect(() => {
    if (!selectedPeerId) return;
    const last = threadMessages[threadMessages.length - 1];
    const lastId = last?.id ?? null;
    const prev = prevLastMessageIdRef.current;
    prevLastMessageIdRef.current = lastId;
    if (!lastId || !prev || lastId === prev) return;

    if (nearBottom) {
      setHasNewBelow(false);
      scrollToBottom("smooth");
    } else {
      setHasNewBelow(true);
    }
  }, [threadMessages, selectedPeerId, nearBottom, scrollToBottom]);

  function clearQueryParams() {
    router.replace(pathname, { scroll: false });
  }

  function selectPeer(peerId: string) {
    setSelectedPeerId(peerId);
    setShowCompose(false);
    router.replace(`${pathname}?peer=${encodeURIComponent(peerId)}`, { scroll: false });
  }

  async function handleComposeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingComposeFile(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await apiFetchMultipartJson<{
        attachment_path: string;
        attachment_name: string;
        attachment_mime: string;
      }>("/api/messages/attachment", fd);
      setComposeAttachment({
        path: res.attachment_path,
        name: res.attachment_name,
        mime: res.attachment_mime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingComposeFile(false);
    }
  }

  async function handleReplyFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingReplyFile(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await apiFetchMultipartJson<{
        attachment_path: string;
        attachment_name: string;
        attachment_mime: string;
      }>("/api/messages/attachment", fd);
      setReplyAttachment({
        path: res.attachment_path,
        name: res.attachment_name,
        mime: res.attachment_mime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingReplyFile(false);
    }
  }

  async function handleSendCompose(e: React.FormEvent) {
    e.preventDefault();
    if (!receiverId.trim() || (!content.trim() && !composeAttachment)) {
      setError("Recipient and a message or attachment are required");
      return;
    }
    setSending(true);
    setDeliveryState("sending");
    setDeliveryDetail("Sending your message...");
    setError("");
    try {
      await sendMutation.mutateAsync({
        receiver_id: receiverId.trim(),
        subject: subject.trim() || null,
        content: content.trim(),
        ...(composeAttachment
          ? {
              attachment_path: composeAttachment.path,
              attachment_name: composeAttachment.name,
              attachment_mime: composeAttachment.mime,
            }
          : {}),
      });
      setReceiverId("");
      setSubject("");
      setContent("");
      setComposeAttachment(null);
      setShowCompose(false);
      clearQueryParams();
      setDeliveryState("sent");
      setDeliveryDetail("Message sent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
      setDeliveryState("failed");
      setDeliveryDetail("Message failed to send.");
    } finally {
      setSending(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPeerId || (!replyContent.trim() && !replyAttachment)) return;
    setReplying(true);
    setDeliveryState("sending");
    setDeliveryDetail("Sending your reply...");
    setError("");
    try {
      await sendMutation.mutateAsync({
        receiver_id: selectedPeerId,
        subject: null,
        content: replyContent.trim(),
        ...(replyAttachment
          ? {
              attachment_path: replyAttachment.path,
              attachment_name: replyAttachment.name,
              attachment_mime: replyAttachment.mime,
            }
          : {}),
      });
      setReplyContent("");
      setReplyAttachment(null);
      setHasNewBelow(false);
      setNearBottom(true);
      scrollToBottom("smooth");
      setDeliveryState("sent");
      setDeliveryDetail("Reply sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
      setDeliveryState("failed");
      setDeliveryDetail("Reply failed to send.");
    } finally {
      setReplying(false);
    }
  }

  const openCompose = () => {
    setShowCompose(true);
    setSelectedPeerId(null);
    router.replace(`${pathname}?compose=1`, { scroll: false });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    setRealtimeConnected(navigator.onLine);
    const online = () => setRealtimeConnected(true);
    const offline = () => setRealtimeConnected(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  useEffect(() => {
    const readByPeer = threadMessages.some((m) => m.sender_id === myId && !!m.read_at);
    if (readByPeer) {
      setDeliveryState("read");
      setDeliveryDetail("Recipient has read your recent message.");
    }
  }, [threadMessages, myId]);

  return (
    <div className="w-full lg:max-w-6xl lg:mx-auto lg:py-8 lg:px-6 min-h-[calc(100dvh-140px)]">
      <div className="bg-card overflow-hidden flex flex-col lg:flex-row min-h-[calc(100dvh-140px)] lg:min-h-[480px] lg:h-[calc(100vh-140px)] lg:border lg:border-border lg:shadow-xl lg:rounded-[32px]">
        <aside
          className={`w-full lg:w-1/3 lg:min-w-[220px] lg:border-r lg:border-border bg-surface-muted/60 flex flex-col ${
            selectedPeerId || showCompose ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-6 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold text-text">Inbox</h1>
              {hasNextPage ? (
                <p className="mt-1 text-[11px] leading-snug text-text-muted">
                  Showing recent threads first. Older activity loads below.
                </p>
              ) : null}
            </div>
            <RealtimeHealthBadge
              connected={realtimeConnected}
              delayed={threadQuery.isLoading || threadQuery.isFetchingNextPage}
            />
            <Button type="button" onClick={() => openCompose()} size="sm">
              <Send className="h-3.5 w-3.5" /> Compose
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-text-muted">Loading messages...</p>
            ) : displayConversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-border">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-text-muted">No conversations yet</p>
                <p className="mt-1 text-xs text-text-muted">
                  Compose a message to a recruiter or reply when someone reaches out.
                </p>
              </div>
            ) : (
              displayConversations.map((c) => (
                <button
                  key={c.peerId}
                  type="button"
                  onClick={() => selectPeer(c.peerId)}
                  className={`w-full text-left p-3 lg:p-4 border-b border-border/40 hover:bg-card transition-all flex gap-3 ${
                    selectedPeerId === c.peerId && !showCompose ? "bg-card ring-1 ring-border" : ""
                  }`}
                >
                  <UserAvatar
                    name={peerProfiles[c.peerId]?.name ?? null}
                    avatarUrl={peerProfiles[c.peerId]?.avatar_url ?? null}
                    userId={c.peerId}
                    size={40}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-2 text-sm font-bold text-text">
                      <span className="truncate">{peerDisplayName(c.peerId, peerProfiles)}</span>
                      {(unreadByPeer[c.peerId] ?? 0) > 0 ? (
                        <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
                          {(unreadByPeer[c.peerId] ?? 0) > 9 ? "9+" : unreadByPeer[c.peerId]}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-text-muted truncate">{c.subject || "Message"}</p>
                    <p className="text-xs text-text-muted truncate mt-0.5">{c.preview}</p>
                    <p className="text-[10px] text-text-muted mt-1">
                      {new Date(c.lastAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))
            )}
            {hasNextPage ? (
              <div className="border-t border-border p-3">
                <button
                  type="button"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full min-h-11 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold text-text transition hover:bg-surface-muted disabled:opacity-60"
                >
                  {isFetchingNextPage ? "Loading older…" : "Load older messages"}
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        <main
          className={`flex-1 flex flex-col bg-card relative min-w-0 ${
            !selectedPeerId && !showCompose && !resolvingComposeUrl ? "hidden lg:flex" : "flex"
          }`}
        >
          {resolvingComposeUrl ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-text-muted">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium">Opening conversation…</p>
            </div>
          ) : showCompose ? (
            <form onSubmit={handleSendCompose} className="flex-1 flex flex-col min-h-0">
              <div className="p-4 lg:p-6 border-b border-border flex justify-between items-center shrink-0">
                <p className="font-display text-sm font-bold text-primary uppercase tracking-widest">
                  New Message
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompose(false);
                      clearQueryParams();
                    }}
                    className="lg:hidden text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompose(false);
                      clearQueryParams();
                    }}
                    className="hidden lg:inline text-xs text-text-muted hover:text-text"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-4 lg:p-8 space-y-4 flex-1 overflow-y-auto">
                <RecipientPicker receiverId={receiverId} onReceiverIdChange={setReceiverId} />
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (optional)"
                />
                <input ref={composeFileRef} type="file" className="hidden" onChange={handleComposeFileChange} />
                {composeAttachment ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs text-text">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <span className="truncate flex-1">{composeAttachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setComposeAttachment(null)}
                      className="shrink-0 rounded p-0.5 text-text-muted hover:bg-surface-muted"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                <Textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    onTypingActivity();
                  }}
                  rows={8}
                  placeholder="Write your message..."
                  className="rounded-xl"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    disabled={uploadingComposeFile}
                    onClick={() => composeFileRef.current?.click()}
                    variant="secondary"
                    size="sm"
                  >
                    {uploadingComposeFile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5" />
                    )}
                    Attach file
                  </Button>
                </div>
                {error && showCompose ? (
                  <InlineRetryCard message={error} onRetry={() => setError("")} retryLabel="Dismiss" />
                ) : null}
                {deliveryState ? <MessageDeliveryState state={deliveryState} detail={deliveryDetail} /> : null}
                <Button type="submit" disabled={sending || uploadingComposeFile} className="w-full sm:w-fit">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
                </Button>
              </div>
            </form>
          ) : selectedPeerId ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-border flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={threadPeerProfiles[selectedPeerId]?.name ?? null}
                    avatarUrl={threadPeerProfiles[selectedPeerId]?.avatar_url ?? null}
                    userId={selectedPeerId}
                    size={44}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Conversation</p>
                    <p className="text-sm font-bold text-text truncate">
                      {peerDisplayName(selectedPeerId, threadPeerProfiles)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeerId(null);
                      clearQueryParams();
                    }}
                    className="lg:hidden text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeerId(null);
                      clearQueryParams();
                    }}
                    className="hidden lg:inline text-xs text-text-muted hover:text-text"
                  >
                    Close
                  </button>
                </div>
              </div>
              {peerTyping ? (
                <p className="border-b border-border px-4 py-2 text-xs italic text-text-muted">
                  {peerDisplayName(selectedPeerId, threadPeerProfiles)} is typing…
                </p>
              ) : null}
              {threadQuery.hasNextPage ? (
                <div className="border-b border-border px-4 py-2">
                  <button
                    type="button"
                    onClick={() => void threadQuery.fetchNextPage()}
                    disabled={threadQuery.isFetchingNextPage}
                    className="min-h-9 text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
                  >
                    {threadQuery.isFetchingNextPage ? "Loading older…" : "Load older in this conversation"}
                  </button>
                </div>
              ) : null}
              {threadQuery.isLoading && threadMessages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-text-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Loading conversation…</p>
                </div>
              ) : threadQuery.error ? (
                <div className="flex-1 p-6 text-sm text-rose-600">Could not load full thread. Try again.</div>
              ) : (
              <div
                ref={messageListRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative"
                onScroll={() => {
                  const el = messageListRef.current;
                  if (!el) return;
                  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
                  const nb = distance <= 80;
                  setNearBottom(nb);
                  if (nb) setHasNewBelow(false);
                }}
              >
                {threadMessages.map((m) => {
                  const mine = m.sender_id === myId;
                  const showUnreadDivider = !mine && firstUnreadInboundId === m.id;
                  return (
                    <div key={m.id}>
                      {showUnreadDivider ? (
                        <div className="my-2 flex items-center gap-3">
                          <div className="h-px flex-1 bg-border" />
                          <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            New messages
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      ) : null}
                      <div className={`flex gap-2 items-end ${mine ? "justify-end" : "justify-start"}`}>
                      {!mine ? (
                        <UserAvatar
                          name={threadPeerProfiles[selectedPeerId]?.name ?? null}
                          avatarUrl={threadPeerProfiles[selectedPeerId]?.avatar_url ?? null}
                          userId={selectedPeerId}
                          size={32}
                          className="mb-1"
                        />
                      ) : null}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-surface-muted text-text rounded-bl-md"
                        }`}
                      >
                        {m.subject ? (
                          <p className={`text-xs font-semibold mb-1 ${mine ? "text-primary-foreground/80" : "text-text-muted"}`}>
                            {m.subject}
                          </p>
                        ) : null}
                        {m.attachment_name || m.attachment_path ? (
                          m.attachment_url ? (
                            <a
                              href={m.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mb-2 inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 ${
                                mine ? "text-primary-foreground/80" : "text-primary"
                              }`}
                            >
                              <Paperclip className="h-3.5 w-3.5 shrink-0" />
                              {m.attachment_name?.trim() || "Attachment"}
                            </a>
                          ) : (
                            <span
                              className={`mb-2 inline-flex items-center gap-1.5 text-xs font-medium ${
                                mine ? "text-primary-foreground/80" : "text-primary"
                              }`}
                            >
                              <Paperclip className="h-3.5 w-3.5 shrink-0" />
                              {m.attachment_name?.trim() || "Attachment"}
                            </span>
                          )
                        ) : null}
                        {m.content &&
                        !(
                          (m.attachment_path || m.attachment_name) &&
                          m.content === "(attachment)"
                        ) ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : null}
                        <p
                          className={`text-[10px] mt-2 flex flex-wrap items-center gap-x-1.5 ${mine ? "text-primary-foreground/70 justify-end" : "text-text-muted"}`}
                        >
                          <span>{new Date(m.created_at).toLocaleString()}</span>
                          {mine ? (
                            <span aria-label={m.read_at ? "Read" : "Sent"}>
                              · {m.read_at ? "Read" : "Sent"}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
                {hasNewBelow ? (
                  <div className="pointer-events-none sticky bottom-16 lg:bottom-2 flex justify-center">
                    <Button
                      type="button"
                      onClick={() => {
                        setHasNewBelow(false);
                        setNearBottom(true);
                        scrollToBottom("smooth");
                      }}
                      className="pointer-events-auto rounded-full px-3 py-1.5 text-xs font-bold"
                      size="sm"
                    >
                      Jump to latest
                    </Button>
                  </div>
                ) : null}
              </div>
              )}
              {!threadQuery.isLoading || threadMessages.length > 0 ? (
              <form
                onSubmit={handleSendReply}
                className="border-t border-border p-3 lg:p-4 bg-surface-muted/60 shrink-0 space-y-2 safe-bottom"
              >
                <input ref={replyFileRef} type="file" className="hidden" onChange={handleReplyFileChange} />
                {replyAttachment ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-text">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <span className="truncate flex-1">{replyAttachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setReplyAttachment(null)}
                      className="shrink-0 rounded p-0.5 text-text-muted hover:bg-surface-muted"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                {error && !showCompose ? (
                  <InlineRetryCard message={error} onRetry={() => setError("")} retryLabel="Dismiss" />
                ) : null}
                {deliveryState ? <MessageDeliveryState state={deliveryState} detail={deliveryDetail} /> : null}
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => {
                      setReplyContent(e.target.value);
                      onTypingActivity();
                    }}
                    rows={2}
                    placeholder="Reply…"
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    type="button"
                    disabled={uploadingReplyFile}
                    onClick={() => replyFileRef.current?.click()}
                    variant="secondary"
                    aria-label="Attach file"
                    className="shrink-0"
                  >
                    {uploadingReplyFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      replying ||
                      (!replyContent.trim() && !replyAttachment) ||
                      sendMutation.isPending ||
                      uploadingReplyFile
                    }
                    className="shrink-0"
                  >
                    {replying || sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />}
                    Send
                  </Button>
                </div>
              </form>
              ) : null}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-surface-muted text-border rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare className="h-9 w-9" />
              </div>
              <p className="font-display text-text-muted font-medium text-lg">Select a conversation</p>
              <p className="text-text-muted text-sm mt-2 max-w-sm leading-relaxed">
                Pick a thread on the left, or use Compose to message someone by name or email.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
