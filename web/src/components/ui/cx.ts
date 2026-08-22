/** Class-name join. Deliberately not `clsx` — the whole API we need is this. */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
