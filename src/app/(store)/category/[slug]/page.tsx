import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopView from "@/components/store/ShopView";
import SetupNotice from "@/components/store/SetupNotice";
import { getCategories } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) return {};
  return {
    title: `${cat.name} — shop online`,
    description: `${cat.description ?? cat.name} at Chitra Saree Centre. Party wear, wedding wear and more.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) notFound();
  return <ShopView sp={await searchParams} fixedCategory={slug} />;
}
