import { notFound } from "next/navigation";
import { LISTINGS, getListing } from "@/lib/data";
import ProdukView from "./produk-view";

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ id: l.id }));
}

// Id di luar daftar statis (listing baru dari Supabase) dirender on-demand,
// lalu disegarkan tiap menit.
export const dynamicParams = true;
export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/pembeli/produk/[id]">) {
  const { id } = await params;
  const l = await getListing(id);
  return { title: l ? `${l.nama} (Grade ${l.grade})` : "Listing" };
}

export default async function ProdukPage({ params }: PageProps<"/pembeli/produk/[id]">) {
  // Next 16: params is async-only.
  const { id } = await params;
  const l = await getListing(id);
  if (!l) notFound();

  return <ProdukView listing={l} />;
}

