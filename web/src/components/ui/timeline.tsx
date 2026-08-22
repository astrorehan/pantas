import type { ReactNode } from "react";
import { cx } from "./cx";

export interface TimelineEvent {
  id: string;
  label: string;
  /** Already-formatted timestamp; absent means "not yet reached". */
  at?: string;
  detail?: ReactNode;
  state?: "done" | "current" | "pending" | "failed";
}

/**
 * Vertical status history — order lifecycle and shipment tracking share it.
 * Rendered as an ordered list so a screen reader gets the sequence for free.
 */
export function Timeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  return (
    <ol className={cx("flex flex-col", className)}>
      {events.map((event, i) => {
        const state = event.state ?? (event.at ? "done" : "pending");
        const last = i === events.length - 1;

        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cx(
                  "mt-1 size-3 shrink-0 rounded-full border-2",
                  state === "done" && "border-brand bg-brand",
                  state === "current" && "border-brand bg-surface",
                  state === "pending" && "border-line bg-surface",
                  state === "failed" && "border-danger bg-danger",
                )}
              />
              {!last && (
                <span
                  aria-hidden
                  className={cx(
                    "w-0.5 flex-1",
                    state === "done" ? "bg-brand" : "bg-line",
                  )}
                />
              )}
            </div>

            <div className={cx("min-w-0 flex-1", last ? "pb-0" : "pb-5")}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p
                  className={cx(
                    "type-body-md",
                    state === "pending"
                      ? "text-muted"
                      : "font-bold text-ink",
                  )}
                >
                  {event.label}
                </p>
                {event.at && (
                  <p className="type-body-sm tnum text-muted">{event.at}</p>
                )}
              </div>
              {event.detail && (
                <div className="type-body-sm pt-1 text-muted">
                  {event.detail}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
