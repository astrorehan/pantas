import { Check } from "lucide-react";
import { cx } from "./cx";

export interface Step {
  label: string;
  href?: string;
}

/**
 * Progress through a fixed sequence (pindai → harga → terbit). Shows position,
 * it does not navigate — a half-finished scan has nothing to go back to.
 */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  /** Zero-based index of the step in progress. */
  current: number;
  className?: string;
}) {
  return (
    <nav aria-label="Langkah" className={className}>
      <ol className="flex items-center gap-2">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.label} className="flex flex-1 items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className="flex min-w-0 items-center gap-2"
              >
                <span
                  className={cx(
                    "type-body-sm flex size-6 shrink-0 items-center justify-center rounded-full font-bold",
                    done && "bg-brand text-on-brand",
                    active && "border-2 border-brand text-brand",
                    !done && !active && "border border-line text-label",
                  )}
                >
                  {done ? (
                    <Check aria-hidden className="size-3.5" />
                  ) : (
                    <span className="tnum">{i + 1}</span>
                  )}
                </span>
                <span
                  className={cx(
                    "type-body-sm hidden truncate sm:block",
                    active ? "font-bold text-ink" : "text-muted",
                  )}
                >
                  {step.label}
                </span>
                <span className="sr-only sm:hidden">{step.label}</span>
              </span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cx(
                    "h-px flex-1",
                    done ? "bg-brand" : "bg-line",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
