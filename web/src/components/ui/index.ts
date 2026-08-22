/**
 * Design system "Panen" (§7). One file per component; screens import from here
 * so a component can move without touching call sites.
 *
 * Rule: components consume semantic tokens (`bg-surface`, `text-ink`,
 * `border-line`), never primitives (`bg-stone-100`) and never raw `bg-white` —
 * that is what makes dark mode a token change instead of a rewrite.
 */
export { cx } from "./cx";

export { Button, ButtonLink, IconButton } from "./button";
export type { ButtonVariant, ButtonSize } from "./button";

export { Card, CardHeader, CardBody, CardFooter } from "./card";
export type { CardVariant } from "./card";

/**
 * Perkakas layar kerja sengaja TIDAK diekspor ulang dari barrel ini.
 *
 * Hampir setiap layar mengimpor sesuatu dari `@/components/ui`, jadi apa pun
 * yang ada di sini ikut masuk chunk yang dibagi semua route — termasuk route
 * yang tidak memakainya. Waktu keempatnya sempat diekspor di sini, baseline
 * bersama naik ~2,4 KB gzip dan `/petani/pindai` — satu-satunya route yang
 * tidak menyentuh satu pun dari keempatnya — terdorong ke 260,5 KB, melewati
 * anggaran NFR-05.
 *
 * Impor langsung dari modulnya:
 *   import { HeroCard } from "@/components/ui/hero-card";
 *   import { Menu } from "@/components/ui/menu";
 *   import { RingkasBaris } from "@/components/ui/ringkas-baris";
 *   import { FilterSheet } from "@/components/ui/filter-sheet";
 */

export { Badge } from "./badge";
export type { BadgeTone } from "./badge";

export { GradeBadge, GradeDot, GradeMark, GradeBar } from "./grade";
export type { GradeBadgeSize, GradeBadgeVariant } from "./grade";

export { Field, Input, Textarea } from "./input";
export { Select } from "./select";
export type { SelectOption } from "./select";
export { Checkbox, Radio, Switch } from "./toggle";

export { SectionLabel } from "./label";
export { Stat } from "./stat";
export { EmptyState } from "./empty-state";
export { Skeleton, SkeletonText, SkeletonCard } from "./skeleton";

export { Dialog, Portal, useModalBehaviour } from "./dialog";
export { Sheet } from "./sheet";
export { Tabs, TabPanel } from "./tabs";
export type { TabItem } from "./tabs";
export { Table, sortRows } from "./table";
export type { Column, SortDir } from "./table";

export { Stepper } from "./stepper";
export type { Step } from "./stepper";
export { Timeline } from "./timeline";
export type { TimelineEvent } from "./timeline";

export { ThemeToggle } from "./theme-toggle";
export { LocaleToggle } from "./locale-toggle";
export { Toaster, toast } from "./toast";

export {
  IconTomat,
  IconCabai,
  IconTimun,
  IconWortel,
  IconGradeA,
  IconGradeB,
  IconGradeC,
  IconGradeReject,
  IconKoinKalibrasi,
  IconPindaiBatch,
  IconKonsolidasiRute,
  IconRantaiDingin,
  IconHashAudit,
  IconSerahTerima,
  CommodityIcon,
  GradeShapeIcon,
  PANTAS_ICON_CATALOG,
} from "./pantas-icons";
