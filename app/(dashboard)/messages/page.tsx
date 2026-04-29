import { Suspense } from "react";
import { MessagesInbox } from "@/components/messages/MessagesInbox";

export default function JobSeekerMessagesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading…</div>}>
      <MessagesInbox />
    </Suspense>
  );
}
