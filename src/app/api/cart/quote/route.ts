import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabase } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { razorpayMode } from "@/lib/razorpay";
import { mainImage } from "@/lib/format";
import type { ProductImage } from "@/lib/types";

const body = z.object({ ids: z.array(z.string().uuid()).max(50) });

// Returns CURRENT prices and stock for the cart (the browser's saved copy may be old).
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const s = await getSettings();
  const { data } = parsed.data.ids.length
    ? await createPublicSupabase().from("products")
        .select("id,slug,name,sku,price,mrp,stock,is_available,images:product_images(id,url,is_main,sort_order,storage_path)")
        .in("id", parsed.data.ids)
    : { data: [] };
  const products = (data ?? []).map((p) => ({
    id: p.id, slug: p.slug, name: p.name, sku: p.sku, price: Number(p.price), mrp: Number(p.mrp),
    stock: p.is_available ? p.stock : 0, image: mainImage(p.images as ProductImage[]),
  }));
  return NextResponse.json({
    products,
    shipping: { fee: Number(s.shipping_fee), freeAbove: s.free_shipping_above ? Number(s.free_shipping_above) : null },
    payments: { cod: s.cod_enabled, upi: s.upi_enabled && Boolean(s.upi_id), razorpay: razorpayMode() },
  });
}
