"use client";

import { useState } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import type { Message } from "@/types/recruiter";
import { useRecruiterMessages, useSendMessage } from "@/hooks/queries/use-recruiter";

export default function MessagesPage() {
  const [receiverId, setReceiverId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showCompose, setShowCompose] = useState(false);

  const { data: messagesRaw, isLoading: loading } = useRecruiterMessages();
  const messages = (messagesRaw ?? []) as Message[];
  const sendMutation = useSendMessage();

  async function handleSend(e: React.FormEvent) {
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
      setReceiverId(""); setSubject(""); setContent(""); setShowCompose(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-6 h-[calc(100vh-140px)]">
      <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[32px] overflow-hidden flex h-full">
        <aside className="w-1/3 border-r border-slate-100 bg-slate-50/50 flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-md flex items-center justify-between gap-3">
            <h1 className="font-display text-lg font-bold text-slate-900">Inbox</h1>
            <button
              onClick={() => setShowCompose(!showCompose)}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
            >
              <Send className="h-3.5 w-3.5" /> Compose
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">Loading messages...</p>
            ) : messages.length === 0 ? (
              <div className="p-6 text-xs text-slate-400">No conversations yet.</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="p-4 border-b border-slate-50 hover:bg-white transition-all cursor-pointer group flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{msg.subject || "Untitled message"}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white relative">
          {showCompose ? (
            <form onSubmit={handleSend} className="flex-1 flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <p className="font-display text-sm font-bold text-indigo-600 uppercase tracking-widest">New Message</p>
              </div>
              <div className="p-8 space-y-4">
                <input
                  type="text"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  placeholder="Recipient User ID (from candidate search)"
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm"
                />
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
                {error && <p className="text-sm text-rose-600">{error}</p>}
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
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare className="h-9 w-9" />
              </div>
              <p className="font-display text-slate-400 font-medium text-lg">No conversations selected</p>
              <p className="text-slate-400 text-xs mt-2 max-w-xs">Start a new message to connect with candidates and keep your hiring communication organized.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare className="h-9 w-9" />
              </div>
              <p className="font-display text-slate-400 font-medium text-lg">Select a conversation</p>
              <p className="text-slate-400 text-xs mt-2 max-w-xs">Choose a thread from the inbox list to view details, or create a new message.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
