import { notFound } from "next/navigation";
import Gallery from "./gallery";

export const metadata = { title: "Design System: Panen" };

/**
 * F-72 — every component, every state, both themes, on one page.
 *
 * Two jobs: it is the visual-regression target Playwright screenshots (§17.2),
 * and it is the evidence that the UI is written rather than borrowed from a
 * component library, which the guidebook forbids (§19.4).
 */
export default function DesignSystemPage() {
  // Dev-only: this is a workbench, not a product surface.
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}
