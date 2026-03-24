"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Volume2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useNotifications, useMarkAllRead, useMarkRead, notificationKeys } from "@/hooks/queries/use-notifications";
import { useQueryClient } from "@tanstack/react-query";

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
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useNotifications();
  const markAllReadMutation = useMarkAllRead();
  const markReadMutation = useMarkRead();
  const queryClient = useQueryClient();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createBrowserClient(supabaseUrl, supabaseKey);
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
          const newNotif = payload.new as Notification;
          queryClient.setQueryData(notificationKeys.list(), (old: Notification[] | undefined) => 
              [newNotif, ...(old ?? [])].slice(0, 30)
          );
          setToast(newNotif.title);
          setTimeout(() => setToast(null), 4000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    await markAllReadMutation.mutateAsync();
  }

  async function markRead(id: string) {
    await markReadMutation.mutateAsync(id);
  }

  return (
    <>
      {/* Toast notification - responsive positioning */}
      {toast && (
        <div className="fixed left-4 right-4 top-16 z-[100] flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 shadow-lg sm:left-auto sm:right-4 sm:top-4 sm:w-auto sm:max-w-sm sm:px-4 sm:py-3">
          <Volume2 className="h-4 w-4 shrink-0 text-green-600" />
          <span className="text-sm font-medium text-green-800 line-clamp-2">{toast}</span>
        </div>
      )}

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200"
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
          <div className="fixed inset-x-3 top-14 z-50 rounded-xl border border-gray-200 bg-card shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1 sm:w-80">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-text">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10 active:bg-primary/20"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto sm:max-h-80">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-text-muted">
                  No notifications yet
                </p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { if (!n.read) markRead(n.id); }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 ${
                      !n.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
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
