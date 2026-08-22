/**
 * One nav source for the public surface, shared by the desktop row in
 * `SiteHeader` and the sheet in `SiteNavMobile` — the two used to be written out
 * separately, which is how the phone ended up showing fewer destinations than
 * the desktop for the same page.
 *
 * `/admin` is deliberately absent. It is a signed-in console, so advertising it
 * here only ever produced a bounce to `/masuk` where any role could sign in,
 * making "Operator Admin" read as a second login button.
 */
export interface SiteNavItem {
  href: string;
  labelKey: string;
}

export const SITE_NAV: SiteNavItem[] = [
  { href: "/#fitur", labelKey: "features" },
  { href: "/tentang", labelKey: "how_it_works" },
  { href: "/tentang/model", labelKey: "ai_model" },
  { href: "/demo", labelKey: "try_demo" },
];
