import type { ReactNode } from "react";
import { cx } from "./ui";

/**
 * Page content wrapper. The cap grows with the breakpoint (§8.2) instead of
 * pinning one width, so a 1440px laptop — the judge's device — sees a laid-out
 * product rather than a phone frame on a grey field.
 */
export function Container({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  /** `wide` opts out of the cap for maps and split views. */
  width?: "default" | "wide" | "narrow";
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12",
        width === "default" &&
          "md:max-w-3xl lg:max-w-[1152px] xl:max-w-[1280px] 2xl:max-w-[1440px]",
        width === "narrow" && "max-w-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
