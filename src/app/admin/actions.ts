"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { firstError, productSchema, settingsSchema, clean, type ProductInput } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/types";
import { notifyOrderStatus, sendTemplate } from "@/lib/whatsapp-server";
import { instagramConfigured, publishImagePost } from "@/lib/instagram-server";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (error: string) => ({ ok: false as const, error });
const uuid = z.string().uuid();

export async function signOut() {
  const sb = await createServerSupabase();
  await sb.auth.signOut();
  redirect("/admin/login");
}

// ---------------- PRODUCTS ----------------
export async function saveProduct(id: string | null, raw: ProductInput): Promise<Result<{ id: string }>> {
  const { sb } = await requireAdmin();
  if (id && !uuid.safeParse(id).success) return fail("Invalid product");
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));
  const d = parsed.data;

  // Unique, readable web address for the product
  let slug = slugify(d.name) || "product";
  const { data: clash } = await sb.from("products").select("id").eq("slug", slug).maybeSingle();
  if (clash && clash.id !== id) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const sku = d.sku.trim().toUpperCase() || `CSC-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const row = {
    name: d.name, sku, description: d.description, category_id: d.category_id, subcategory_id: d.subcategory_id,
    fabric_id: d.fabric_id, work_type_id: d.work_type_id, price: d.price, mrp: d.mrp, stock: d.stock,
    is_available: d.is_available, is_featured: d.is_featured, is_new_arrival: d.is_new_arrival, is_best_seller: d.is_best_seller,
    tags: d.tags.filter(Boolean),
  };

  let productId = id;
  if (id) {
    const { data: current } = await sb.from("products").select("slug,name").eq("id", id).single();
    const { error } = await sb.from("products").update({ ...row, slug: current && current.name === d.name ? current.slug : slug }).eq("id", id);
    if (error) return fail(error.message.includes("products_sku_key") ? "Another product already uses this product code." : error.message);
  } else {
    const { data, error } = await sb.from("products").insert({ ...row, slug }).select("id").single();
    if (error || !data) return fail(error?.message.includes("products_sku_key") ? "Another product already uses this product code." : error?.message ?? "Could not save");
    productId = data.id;
  }

  // Photos: keep, add, remove
  const { data: oldImgs } = await sb.from("product_images").select("id,url,storage_path").eq("product_id", productId!);
  const keepUrls = new Set(d.images.map((i) => i.url));
  const removed = (oldImgs ?? []).filter((i) => !keepUrls.has(i.url));
  if (removed.length) {
    await sb.from("product_images").delete().in("id", removed.map((r) => r.id));
    const paths = removed.map((r) => r.storage_path).filter((p): p is string => !!p);
    if (paths.length) await sb.storage.from("product-images").remove(paths);
  }
  const mainIdx = Math.min(d.main_index, Math.max(d.images.length - 1, 0));
  for (const [i, img] of d.images.entries()) {
    const existing = (oldImgs ?? []).find((o) => o.url === img.url);
    const values = { is_main: i === mainIdx, sort_order: i };
    if (existing) await sb.from("product_images").update(values).eq("id", existing.id);
    else await sb.from("product_images").insert({ product_id: productId!, url: img.url, storage_path: img.storage_path, ...values });
  }

  revalidatePath("/", "layout");
  return { ok: true, id: productId! };
}

export async function deleteProduct(id: string): Promise<Result> {
  const { sb } = await requireAdmin();
  if (!uuid.safeParse(id).success) return fail("Invalid product");
  const { data: imgs } = await sb.from("product_images").select("storage_path").eq("product_id", id);
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) return fail(error.message);
  const paths = (imgs ?? []).map((i) => i.storage_path).filter((p): p is string => !!p);
  if (paths.length) await sb.storage.from("product-images").remove(paths);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteDemoProducts(): Promise<Result<{ count: number }>> {
  const { sb } = await requireAdmin();
  const { error, count } = await sb.from("products").delete({ count: "exact" }).eq("is_demo", true);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: true, count: count ?? 0 };
}

export async function updateStock(id: string, stock: number): Promise<Result> {
  const { sb } = await requireAdmin();
  const s = z.number().int().min(0).max(100000).safeParse(stock);
  if (!uuid.safeParse(id).success || !s.success) return fail("Enter a whole number, 0 or more");
  const { error } = await sb.from("products").update({ stock: s.data }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------------- ORDERS ----------------
export async function updateOrderStatus(id: string, status: string, notifyCustomer: boolean): Promise<Result<{ whatsapp?: string }>> {
  const { sb } = await requireAdmin();
  if (!uuid.safeParse(id).success || !(ORDER_STATUSES as readonly string[]).includes(status)) return fail("Invalid status");
  const { data, error } = await sb.from("orders").update({ order_status: status }).eq("id", id)
    .select("id,phone,customer_name,order_number").single();
  if (error || !data) return fail(error?.message.includes("cannot be reopened") ? "A cancelled order cannot be reopened. Please create a new order instead." : error?.message ?? "Could not update");
  let whatsapp: string | undefined;
  if (notifyCustomer && status !== "pending") {
    const r = await notifyOrderStatus(data, status);
    whatsapp = r.status === "sent" ? "WhatsApp update sent to the customer." : r.status === "demo" ? "WhatsApp is in demo mode — message logged, not sent." : `WhatsApp message failed: ${r.detail}`;
  }
  revalidatePath("/admin", "layout");
  return { ok: true, whatsapp };
}

export async function updatePaymentStatus(id: string, status: string): Promise<Result> {
  const { sb } = await requireAdmin();
  if (!uuid.safeParse(id).success || !(PAYMENT_STATUSES as readonly string[]).includes(status)) return fail("Invalid status");
  const { error } = await sb.from("orders").update({ payment_status: status }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------------- CATEGORIES & LOOKUPS ----------------
const nameSchema = z.string().transform(clean).pipe(z.string().min(1, "Enter a name").max(60, "Name is too long"));

export async function saveCategory(id: string | null, name: string, description: string): Promise<Result> {
  const { sb } = await requireAdmin();
  const n = nameSchema.safeParse(name);
  if (!n.success) return fail(firstError(n.error));
  const desc = clean(description).slice(0, 200) || null;
  if (id) {
    const { error } = await sb.from("categories").update({ name: n.data, description: desc }).eq("id", id);
    if (error) return fail(error.message);
  } else {
    const { count } = await sb.from("categories").select("id", { count: "exact", head: true });
    const { error } = await sb.from("categories").insert({ name: n.data, description: desc, slug: slugify(n.data), sort_order: (count ?? 0) + 1 });
    if (error) return fail(error.message.includes("duplicate") ? "A category with this name already exists." : error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setCategoryVisible(id: string, visible: boolean): Promise<Result> {
  const { sb } = await requireAdmin();
  const { error } = await sb.from("categories").update({ is_active: visible }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  const { sb } = await requireAdmin();
  const { count } = await sb.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count) return fail(`This category has ${count} product(s). Move or delete them first, or hide the category instead.`);
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveSubcategory(categoryId: string, name: string): Promise<Result> {
  const { sb } = await requireAdmin();
  const n = nameSchema.safeParse(name);
  if (!n.success) return fail(firstError(n.error));
  const { error } = await sb.from("subcategories").insert({ category_id: categoryId, name: n.data, slug: slugify(n.data), sort_order: 99 });
  if (error) return fail(error.message.includes("duplicate") ? "This type already exists in the category." : error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteSubcategory(id: string): Promise<Result> {
  const { sb } = await requireAdmin();
  const { error } = await sb.from("subcategories").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveLookup(table: "fabrics" | "work_types", name: string): Promise<Result> {
  const { sb } = await requireAdmin();
  if (table !== "fabrics" && table !== "work_types") return fail("Invalid");
  const n = nameSchema.safeParse(name);
  if (!n.success) return fail(firstError(n.error));
  const { error } = await sb.from(table).insert({ name: n.data, sort_order: 50 });
  if (error) return fail(error.message.includes("duplicate") ? "This already exists." : error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteLookup(table: "fabrics" | "work_types", id: string): Promise<Result> {
  const { sb } = await requireAdmin();
  if (table !== "fabrics" && table !== "work_types") return fail("Invalid");
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------------- SETTINGS ----------------
export async function saveSettings(raw: Record<string, unknown>, logoUrl: string | null, qrUrl: string | null): Promise<Result> {
  const { sb } = await requireAdmin();
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));
  const okImg = (u: string | null) => !u || u.startsWith("/") || /^https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/product-images\//.test(u);
  if (!okImg(logoUrl) || !okImg(qrUrl)) return fail("Invalid image");
  const data = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v]));
  const { error } = await sb.from("settings").update({ ...data, business_name: parsed.data.business_name, logo_url: logoUrl, upi_qr_url: qrUrl }).eq("id", 1);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------------- SOCIAL ----------------
export async function sendWhatsAppTest(phone: string): Promise<Result<{ message: string }>> {
  await requireAdmin();
  const digits = phone.replace(/\D/g, "");
  if (!/^(91)?[6-9]\d{9}$/.test(digits)) return fail("Enter a valid 10-digit mobile number");
  // "hello_world" is Meta's ready-made test template
  const r = await sendTemplate(digits, "hello_world", []);
  if (r.status === "failed") return fail(r.detail);
  return { ok: true, message: r.status === "sent" ? "Test message sent. Check WhatsApp on that phone." : "Demo mode: nothing was sent. Add your WhatsApp API details to send real messages." };
}

export async function saveInstagramPost(productId: string | null, caption: string, imageUrl: string | null, publish: boolean): Promise<Result<{ message: string }>> {
  const { sb } = await requireAdmin();
  const cap = z.string().min(1, "Caption is empty").max(2200, "Instagram captions can be at most 2,200 characters").safeParse(caption);
  if (!cap.success) return fail(firstError(cap.error));
  const { data: post, error } = await sb.from("instagram_posts")
    .insert({ product_id: productId, caption: cap.data, image_url: imageUrl, status: "draft" }).select("id").single();
  if (error || !post) return fail(error?.message ?? "Could not save");
  if (!publish) { revalidatePath("/admin/social"); return { ok: true, message: "Saved as draft." }; }

  if (!instagramConfigured()) return fail("Instagram is not connected yet. The post was saved as a draft.");
  if (!imageUrl || !imageUrl.startsWith("https://") || !/\.(jpe?g)$/i.test(imageUrl)) {
    return fail("Instagram needs a JPG product photo uploaded through the dashboard. The post was saved as a draft.");
  }
  try {
    const mediaId = await publishImagePost(imageUrl, cap.data);
    await sb.from("instagram_posts").update({ status: "published", ig_media_id: mediaId, published_at: new Date().toISOString() }).eq("id", post.id);
    revalidatePath("/admin/social");
    return { ok: true, message: "Published to Instagram." };
  } catch (e) {
    await sb.from("instagram_posts").update({ status: "failed", error: (e as Error).message.slice(0, 500) }).eq("id", post.id);
    return fail(`Instagram said: ${(e as Error).message}`);
  }
}
