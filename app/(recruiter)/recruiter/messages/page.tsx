"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import type { Message } from "@/types/recruiter";

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiverId, setReceiverId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    fetch("/api/recruiter/messages")
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages)
      .finally(() => setLoading(false));
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!receiverId.trim() || !content.trim()) {
      setError("Recipient and message are required");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/recruiter/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: receiverId.trim(),
          subject: subject.trim() || null,
          content: content.trim(),
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [msg, ...prev]);
        setReceiverId("");
        setSubject("");
        setContent("");
        setShowCompose(false);
      } else {
        const data = await res.json();
        setError(data.error || "Send failed");
      }
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-text">Messages</h1>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Send className="h-4 w-4" /> Compose
        </button>
      </div>

      {showCompose && (
        <form onSubmit={handleSend} className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-text">New Message</h3>
          <input
            type="text" value={receiverId} onChange={(e) => setReceiverId(e.target.value)}
            placeholder="Recipient User ID (from candidate search)"
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
          <input
            type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
          <textarea
            value={content} onChange={(e) => setContent(e.target.value)}
            rows={4} placeholder="Write your message..."
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={sending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Loading messages...</p>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-muted">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`rounded-lg border bg-card p-4 ${msg.is_read ? "border-gray-200" : "border-primary/30 bg-primary/5"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  {msg.subject && <h4 className="text-sm font-semibold text-text">{msg.subject}</h4>}
                  <p className="text-sm text-text mt-1">{msg.content}</p>
                </div>
                <span className="shrink-0 text-xs text-text-muted">
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
