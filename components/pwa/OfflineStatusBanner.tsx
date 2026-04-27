"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineStatusBanner() {
  const [online, setOnline] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!hydrated || online) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] border-b border-amber-200 bg-amber-50/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-xs font-medium text-amber-900 sm:text-sm">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>
          You are offline. Live AI and API features may not update until connection returns.
        </span>
      </div>
    </div>
  );
}
