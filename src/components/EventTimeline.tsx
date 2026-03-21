"use client";

import { useContractEvents } from "@/lib/hooks/useContractEvents";
import type { TimelineEvent } from "@/lib/hooks/useContractEvents";
import { type Address } from "viem";
import { useT } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n";
import { formatAVAX } from "@/lib/utils";

const DOT: Record<TimelineEvent["color"], string> = {
  green: "bg-green-500",
  amber: "bg-amber-400",
  red:   "bg-red-500",
  blue:  "bg-blue-500",
  stone: "bg-stone-300",
};

const LABEL: Record<TimelineEvent["color"], string> = {
  green: "text-green-700",
  amber: "text-amber-700",
  red:   "text-red-700",
  blue:  "text-blue-700",
  stone: "text-stone-700",
};

function formatTs(ts: number) {
  return new Date(ts * 1000).toLocaleString("es-AR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

type Args = Record<string, unknown>;

type LabelBuilder = (tl: Translations["timeline"], a: Args) => string;

const LABEL_BUILDERS: Record<string, LabelBuilder> = {
  ContractCreated:           (tl)    => tl.ContractCreated,
  Funded:                    (tl, a) => tl.Funded(formatAVAX(a.amount as bigint)),
  Proposed:                  (tl, a) => tl.Proposed(formatAVAX(a.tenantAmount as bigint)),
  Accepted:                  (tl)    => tl.Accepted,
  Rejected:                  (tl)    => tl.Rejected,
  Resolved:                  (tl, a) => tl.Resolved(formatAVAX(a.tenantAmount as bigint), formatAVAX(a.landlordAmount as bigint)),
  TimeoutExecuted:           (tl)    => tl.TimeoutExecuted,
  ArbitratorTimeoutExecuted: (tl)    => tl.ArbitratorTimeoutExecuted,
  Reclaimed:                 (tl, a) => tl.Reclaimed(formatAVAX(a.amount as bigint)),
  Cancelled:                 (tl)    => tl.Cancelled,
  CancelledPending:          (tl)    => tl.CancelledPending,
  Withdrawn:                 (tl, a) => tl.Withdrawn(formatAVAX(a.amount as bigint)),
};

function getTranslatedLabel(ev: TimelineEvent, t: Translations): { label: string; detail?: string } {
  const builder = LABEL_BUILDERS[ev.eventName];
  if (!builder) return { label: ev.label, detail: ev.detail };
  return { label: builder(t.timeline, ev.eventArgs ?? {}) };
}

export function EventTimeline({ address }: Readonly<{ address: Address }>) {
  const { events: rawEvents, isLoading } = useContractEvents(address);
  const { t } = useT();

  const events = rawEvents.map(ev => {
    const translated = getTranslatedLabel(ev, t);
    return { ...ev, label: translated.label, detail: translated.detail ?? ev.detail };
  });

  if (isLoading) {
    return (
      <div className="card">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-4">{t.timeline.title}</p>
        <div className="flex items-center gap-2 text-stone-300 text-sm">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {t.timeline.loading}
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="card">
      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-5">{t.timeline.title}</p>
      <ol>
        {events.map((ev, i) => (
          <li key={ev.id} className="flex gap-3 pb-5 last:pb-0">
            <div className="flex flex-col items-center flex-shrink-0 w-2.5">
              <div className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${DOT[ev.color]}`} />
              {i < events.length - 1 && (
                <div className="w-px flex-1 bg-[#E5DFD5] mt-1.5" />
              )}
            </div>
            <div className="flex-1 min-w-0 -mt-0.5">
              <p className={`text-sm font-bold leading-snug ${LABEL[ev.color]}`}>{ev.label}</p>
              {ev.detail && (
                <p className="text-xs text-stone-400 mt-0.5">{ev.detail}</p>
              )}
              {ev.timestamp && (
                <p className="text-[11px] text-stone-300 mt-1">{formatTs(ev.timestamp)}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
