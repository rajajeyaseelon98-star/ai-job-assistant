"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export function initialsFromName(name: string | null | undefined, fallbackId?: string): string {
  const n = (name ?? "").trim();
  if (n.length >= 1) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  if (fallbackId && fallbackId.length >= 8) {
    return fallbackId.slice(-2).toUpperCase();
  }
  return "?";
}

type UserAvatarProps = {
  name: string | null | undefined;
  avatarUrl?: string | null;
  userId?: string;
  size?: number;
  className?: string;
};

export function UserAvatar({ name, avatarUrl, userId, size = 40, className }: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(avatarUrl && !imgFailed);
  const label = initialsFromName(name, userId);

  if (showImg) {
    return (
      <Image
        src={avatarUrl!}
        alt=""
        width={size}
        height={size}
        className={cn("rounded-full object-cover shrink-0", className)}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-primary",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {label}
    </div>
  );
}
