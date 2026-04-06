"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  const threadPeerProfiles = useMemo(
    () => ({ ...peerProfiles, ...threadQuery.peer_profiles }),
    [peerProfiles, threadQuery.peer_profiles]
  );

  const threadMessages = threadQuery.messages;

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
    void apiFetch("/api/messages/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peer_id: selectedPeerId }),
    })
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: recruiterKeys.unreadSummary() });
        void queryClient.invalidateQueries({ queryKey: recruiterKeys.messages() });
      })
      .catch(() => {});
  }, [selectedPeerId, myId, queryClient]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPeerId || (!replyContent.trim() && !replyAttachment)) return;
    setReplying(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setReplying(false);
    }
  }

  const openCompose = () => {
    setShowCompose(true);
    setSelectedPeerId(null);
    router.replace(`${pathname}?compose=1`, { scroll: false });
  };

  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-6 h-[calc(100vh-140px)]">
      <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[32px] overflow-hidden flex h-full min-h-[480px]">
        <aside className="w-1/3 min-w-[220px] border-r border-slate-100 bg-slate-50/50 flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold text-slate-900">Inbox</h1>
              {hasNextPage ? (
                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                  Showing recent threads first. Older activity loads below.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => openCompose()}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
            >
              <Send className="h-3.5 w-3.5" /> Compose
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">Loading messages...</p>
            ) : displayConversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-slate-600">No conversations yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Compose a message to a recruiter or reply when someone reaches out.
                </p>
              </div>
            ) : (
              displayConversations.map((c) => (
                <button
                  key={c.peerId}
                  type="button"
                  onClick={() => selectPeer(c.peerId)}
                  className={`w-full text-left p-4 border-b border-slate-50 hover:bg-white transition-all flex gap-3 ${
                    selectedPeerId === c.peerId && !showCompose ? "bg-white ring-1 ring-indigo-100" : ""
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
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <span className="truncate">{peerDisplayName(c.peerId, peerProfiles)}</span>
                      {(unreadByPeer[c.peerId] ?? 0) > 0 ? (
                        <span className="shrink-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          {(unreadByPeer[c.peerId] ?? 0) > 9 ? "9+" : unreadByPeer[c.peerId]}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{c.subject || "Message"}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{c.preview}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(c.lastAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))
            )}
            {hasNextPage ? (
              <div className="border-t border-slate-100 p-3">
                <button
                  type="button"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {isFetchingNextPage ? "Loading older…" : "Load older messages"}
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white relative min-w-0">
          {resolvingComposeUrl ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-slate-500">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Opening conversation…</p>
            </div>
          ) : showCompose ? (
            <form onSubmit={handleSendCompose} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                <p className="font-display text-sm font-bold text-indigo-600 uppercase tracking-widest">
                  New Message
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompose(false);
                    clearQueryParams();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
              <div className="p-8 space-y-4 flex-1 overflow-y-auto">
                <RecipientPicker receiverId={receiverId} onReceiverIdChange={setReceiverId} />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm"
                />
                <input ref={composeFileRef} type="file" className="hidden" onChange={handleComposeFileChange} />
                {composeAttachment ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="truncate flex-1">{composeAttachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setComposeAttachment(null)}
                      className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-200"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    onTypingActivity();
                  }}
                  rows={8}
                  placeholder="Write your message..."
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={uploadingComposeFile}
                    onClick={() => composeFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {uploadingComposeFile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5" />
                    )}
                    Attach file
                  </button>
                </div>
                {error && showCompose && <p className="text-sm text-rose-600">{error}</p>}
                <button
                  type="submit"
                  disabled={sending || uploadingComposeFile}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-xl px-8 py-3 font-bold transition-all flex items-center gap-2 w-fit disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              </div>
            </form>
          ) : selectedPeerId ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={threadPeerProfiles[selectedPeerId]?.name ?? null}
                    avatarUrl={threadPeerProfiles[selectedPeerId]?.avatar_url ?? null}
                    userId={selectedPeerId}
                    size={44}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Conversation</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {peerDisplayName(selectedPeerId, threadPeerProfiles)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeerId(null);
                    clearQueryParams();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
              {peerTyping ? (
                <p className="border-b border-slate-100 px-4 py-2 text-xs italic text-slate-500">
                  {peerDisplayName(selectedPeerId, threadPeerProfiles)} is typing…
                </p>
              ) : null}
              {threadQuery.hasNextPage ? (
                <div className="border-b border-slate-100 px-4 py-2">
                  <button
                    type="button"
                    onClick={() => void threadQuery.fetchNextPage()}
                    disabled={threadQuery.isFetchingNextPage}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                  >
                    {threadQuery.isFetchingNextPage ? "Loading older…" : "Load older in this conversation"}
                  </button>
                </div>
              ) : null}
              {threadQuery.isLoading && threadMessages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-sm">Loading conversation…</p>
                </div>
              ) : threadQuery.error ? (
                <div className="flex-1 p-6 text-sm text-rose-600">Could not load full thread. Try again.</div>
              ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {threadMessages.map((m) => {
                  const mine = m.sender_id === myId;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 items-end ${mine ? "justify-end" : "justify-start"}`}
                    >
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
                            ? "bg-indigo-600 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-900 rounded-bl-md"
                        }`}
                      >
                        {m.subject ? (
                          <p className={`text-xs font-semibold mb-1 ${mine ? "text-indigo-100" : "text-slate-600"}`}>
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
                                mine ? "text-indigo-100" : "text-indigo-700"
                              }`}
                            >
                              <Paperclip className="h-3.5 w-3.5 shrink-0" />
                              {m.attachment_name?.trim() || "Attachment"}
                            </a>
                          ) : (
                            <span
                              className={`mb-2 inline-flex items-center gap-1.5 text-xs font-medium ${
                                mine ? "text-indigo-100" : "text-indigo-700"
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
                          className={`text-[10px] mt-2 flex flex-wrap items-center gap-x-1.5 ${mine ? "text-indigo-200 justify-end" : "text-slate-400"}`}
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
                  );
                })}
              </div>
              )}
              {!threadQuery.isLoading || threadMessages.length > 0 ? (
              <form
                onSubmit={handleSendReply}
                className="border-t border-slate-100 p-4 bg-slate-50/80 shrink-0 space-y-2"
              >
                <input ref={replyFileRef} type="file" className="hidden" onChange={handleReplyFileChange} />
                {replyAttachment ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="truncate flex-1">{replyAttachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setReplyAttachment(null)}
                      className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-100"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                {error && !showCompose && <p className="text-sm text-rose-600">{error}</p>}
                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyContent}
                    onChange={(e) => {
                      setReplyContent(e.target.value);
                      onTypingActivity();
                    }}
                    rows={2}
                    placeholder="Reply…"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    disabled={uploadingReplyFile}
                    onClick={() => replyFileRef.current?.click()}
                    className="shrink-0 inline-flex h-[46px] w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    aria-label="Attach file"
                  >
                    {uploadingReplyFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={
                      replying ||
                      (!replyContent.trim() && !replyAttachment) ||
                      sendMutation.isPending ||
                      uploadingReplyFile
                    }
                    className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {replying || sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Reply className="h-4 w-4" />
                    )}
                    Send
                  </button>
                </div>
              </form>
              ) : null}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare className="h-9 w-9" />
              </div>
              <p className="font-display text-slate-600 font-medium text-lg">Select a conversation</p>
              <p className="text-slate-500 text-sm mt-2 max-w-sm leading-relaxed">
                Pick a thread on the left, or use Compose to message someone by name or email.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
