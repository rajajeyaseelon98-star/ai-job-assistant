"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface SuccessAnimationProps {
  message: string;
  show: boolean;
  onDone?: () => void;
  duration?: number;
}

export function SuccessAnimation({ message, show, onDone, duration = 3000 }: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDoneRef.current?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="rounded-2xl bg-card border border-gray-200 shadow-2xl px-8 py-6 text-center max-w-sm mx-4 animate-in zoom-in-95 duration-300">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold text-text">{message}</p>
      </div>
    </div>
  );
}
