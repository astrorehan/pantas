"use client";

import dynamic from "next/dynamic";
import type { Pengiriman } from "@/lib/types";

// Dynamic import with ssr: false is only allowed inside Client Components in recent Next.js versions
const RoutePlanner = dynamic(() => import("./route-planner"), { ssr: false });

export default function RoutePlannerDynamic({ pengirimanList }: { pengirimanList: Pengiriman[] }) {
  return <RoutePlanner pengirimanList={pengirimanList} />;
}
