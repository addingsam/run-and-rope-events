"use client";

import { useState } from "react";
import { AdminEventPanel } from "@/components/admin/AdminEventPanel";
import { AdminProRodeoPanel } from "@/components/admin/AdminProRodeoPanel";
import type { PendingEventReview } from "@/lib/events/duplicate-detection";
import type { EventRecord } from "@/types/event-record";
import type { ProRodeoRecord } from "@/types/pro-rodeo-record";

type AdminSection = "submissions" | "pro-rodeos";

interface AdminPanelProps {
  pendingEventReviews: PendingEventReview[];
  approvedEvents: EventRecord[];
  rejectedEvents: EventRecord[];
  proRodeos: ProRodeoRecord[];
}

export function AdminPanel({
  pendingEventReviews,
  approvedEvents,
  rejectedEvents,
  proRodeos,
}: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>("submissions");

  const sections: { id: AdminSection; label: string }[] = [
    { id: "submissions", label: "Event submissions" },
    { id: "pro-rodeos", label: "Pro rodeos" },
  ];

  return (
    <div>
      <div className="border-b border-stone-300">
        <nav className="-mb-px flex gap-8">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
                activeSection === section.id
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {activeSection === "submissions" ? (
          <AdminEventPanel
            pendingEventReviews={pendingEventReviews}
            approvedEvents={approvedEvents}
            rejectedEvents={rejectedEvents}
          />
        ) : (
          <AdminProRodeoPanel proRodeos={proRodeos} />
        )}
      </div>
    </div>
  );
}
