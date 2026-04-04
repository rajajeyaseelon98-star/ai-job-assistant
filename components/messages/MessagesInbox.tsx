"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Send, Loader2, MessageSquare, Reply } from "lucide-react";
import type { Message } from "@/types/recruiter";
import type { PeerProfile } from "@/types/messages";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useMessages } from "@/hooks/queries/use-messages";
import { useSendMessage } from "@/hooks/queries/use-recruiter";
import { useUser } from "@/hooks/queries/use-user";
import { apiFetch } from "@/lib/api-fetcher";
import { RecipientPicker } from "@/components/messages/RecipientPicker";

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
      seen.set(peer, {
        peerId: peer,
        lastAt: m.created_at,
        preview: m.content.slice(0, 100),
        subject: m.subject,
      });
    }
  }
  return Array.from(seen.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );
}

function threadForPeer(messages: Message[], myId: string, peerId: string): Message[] {
  return messages
    .filter(
      (m) =>
        (m.sender_id === myId && m.receiver_id === peerId) ||
        (m.sender_id === peerId && m.receiver_id === myId)
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function MessagesInbox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: userData } = useUser();
  const myId = userData?.id ?? "";

  const { data: messagesRaw, isLoading: loading } = useMessages();
  const messages = useMemo(() => messagesRaw?.messages ?? [], [messagesRaw]);
  const peerProfiles = useMemo(
    () => messagesRaw?.peer_profiles ?? {},
    [messagesRaw]
  );
  const sendMutation = useSendMessage();

  const [receiverId, setReceiverId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  const conversations = useMemo(() => {
    if (!myId) return [];
    return buildConversations(messages, myId);
  }, [messages, myId]);

  const thread = useMemo(() => {
    if (!myId || !selectedPeerId) return [];
    return threadForPeer(messages, myId, selectedPeerId);
  }, [messages, myId, selectedPeerId]);

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
    }).catch(() => {});
  }, [selectedPeerId, myId]);

  function clearQueryParams() {
    router.replace(pathname, { scroll: false });
  }

  function selectPeer(peerId: string) {
    setSelectedPeerId(peerId);
    setShowCompose(false);
    router.replace(`${pathname}?peer=${encodeURIComponent(peerId)}`, { scroll: false });
  }

  async function handleSendCompose(e: React.FormEvent) {
    e.preventDefault();
    if (!receiverId.trim() || !content.trim()) {
      setError("Recipient and message are required");
      return;
    }
    setSending(true);
    setError("");
    try {
      await sendMutation.mutateAsync({
        receiver_id: receiverId.trim(),
        subject: subject.trim() || null,
        content: content.trim(),
      });
      setReceiverId("");
      setSubject("");
      setContent("");
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
    if (!selectedPeerId || !replyContent.trim()) return;
    setReplying(true);
    setError("");
    try {
      await sendMutation.mutateAsync({
        receiver_id: selectedPeerId,
        subject: null,
        content: replyContent.trim(),
      });
      setReplyContent("");
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
            <h1 className="font-display text-lg font-bold text-slate-900">Inbox</h1>
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
            ) : conversations.length === 0 ? (
              <div className="p-6 text-xs text-slate-400">No conversations yet.</div>
            ) : (
              conversations.map((c) => (
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
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {peerDisplayName(c.peerId, peerProfiles)}
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
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="Write your message..."
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm"
                />
                {error && showCompose && <p className="text-sm text-rose-600">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
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
                    name={peerProfiles[selectedPeerId]?.name ?? null}
                    avatarUrl={peerProfiles[selectedPeerId]?.avatar_url ?? null}
                    userId={selectedPeerId}
                    size={44}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Conversation</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {peerDisplayName(selectedPeerId, peerProfiles)}
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
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {thread.map((m) => {
                  const mine = m.sender_id === myId;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 items-end ${mine ? "justify-end" : "justify-start"}`}
                    >
                      {!mine ? (
                        <UserAvatar
                          name={peerProfiles[selectedPeerId]?.name ?? null}
                          avatarUrl={peerProfiles[selectedPeerId]?.avatar_url ?? null}
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
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <p className={`text-[10px] mt-2 ${mine ? "text-indigo-200" : "text-slate-400"}`}>
                          {new Date(m.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                onSubmit={handleSendReply}
                className="border-t border-slate-100 p-4 bg-slate-50/80 shrink-0 space-y-2"
              >
                {error && !showCompose && <p className="text-sm text-rose-600">{error}</p>}
                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                    placeholder="Reply…"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyContent.trim()}
                    className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />}
                    Send
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare className="h-9 w-9" />
              </div>
              <p className="font-display text-slate-400 font-medium text-lg">Select a conversation</p>
              <p className="text-slate-400 text-xs mt-2 max-w-xs">
                Choose a thread on the left, or compose and search by name or email.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
