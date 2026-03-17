"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Volume2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  success: "bg-green-500",
  warning: "bg-yellow-500",
  auto_apply: "bg-purple-500",
  application: "bg-blue-500",
  message: "bg-indigo-500",
  info: "bg-gray-500",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then(setNotifications)
      .catch(() => {});
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Fallback to polling if env vars not available on client
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }

    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 30));

          // Show toast
          setToast(newNotif.title);
          setTimeout(() => setToast(null), 4000);
        }
      )
      .subscribe();

    // Still poll occasionally as backup (every 60s instead of 30s)
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed right-4 top-4 z-[100] flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg animate-in slide-in-from-top-2">
          <Volume2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">{toast}</span>
        </div>
      )}

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative rounded-lg p-2 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-text-muted" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-gray-200 bg-card shadow-lg z-50">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-text">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-text-muted">
                  No notifications yet
                </p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { if (!n.read) markRead(n.id); }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                      !n.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      !n.read ? (TYPE_COLORS[n.type] || TYPE_COLORS.info) : "bg-transparent"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read ? "font-medium text-text" : "text-text-muted"}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-text-muted">
                        {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
