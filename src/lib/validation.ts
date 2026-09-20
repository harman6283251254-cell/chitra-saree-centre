import { z } from "zod";

// Remove HTML tags and control characters from free text.
export const clean = (s: string) => s.replace(/<[^>]*>/g, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
const text = (max: number) => z.string().transform(clean).pipe(z.string().max(max));
const reqText = (label: string, max: number) =>
  z.string().transform(clean).pipe(z.string().min(1, `${label} is required`).max(max, `${label} is too long`));

export const indianMobile = z.string().transform((s) => s.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

export const checkoutSchema = z.object({
  name: reqText("Name", 80),
  phone: indianMobile,
  email: z.string().trim().max(120).email("Enter a valid email").or(z.literal("")).optional().default(""),
  address: reqText("Address", 300),
  city: reqText("City", 60),
  state: reqText("State", 60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  notes: text(300).optional().default(""),
  payment_method: z.enum(["cod", "razorpay", "upi"]),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

const money = z.coerce.number({ error: "Enter a number" }).min(0, "Cannot be negative").max(10000000);
const optionalId = z.string().uuid().or(z.literal("")).transform((v) => v || null);

export const productSchema = z.object({
  name: reqText("Product name", 160).pipe(z.string().min(2, "Product name is too short")),
  sku: z.string().trim().max(40).regex(/^[A-Za-z0-9-_/]*$/, "Use only letters, numbers and dashes").default(""),
  category_id: optionalId,
  subcategory_id: optionalId,
  fabric_id: optionalId,
  work_type_id: optionalId,
  description: text(4000).default(""),
  mrp: money,
  price: money,
  stock: z.coerce.number().int("Stock must be a whole number").min(0).max(100000),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  is_new_arrival: z.boolean(),
  is_best_seller: z.boolean(),
  tags: z.array(z.string().transform(clean).pipe(z.string().max(40))).max(20).default([]),
  images: z.array(z.object({
    url: z.string().max(500).refine((u) => u.startsWith("/demo/") || /^https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/product-images\//.test(u), "Invalid image"),
    storage_path: z.string().max(300).nullable(),
  })).max(10, "Maximum 10 photos"),
  main_index: z.number().int().min(0).default(0),
}).refine((d) => d.price <= d.mrp, { message: "Selling price cannot be more than MRP", path: ["price"] });
export type ProductInput = z.infer<typeof productSchema>;

export const settingsSchema = z.object({
  business_name: reqText("Business name", 80),
  tagline: text(120),
  phone_primary: text(20),
  phone_secondary: text(20),
  whatsapp_number: text(20),
  email: z.string().trim().max(120).email("Enter a valid email").or(z.literal("")),
  maps_url: z.string().trim().max(300).url("Enter a full link starting with https://").or(z.literal("")),
  store_address: text(300),
  store_hours: text(200),
  store_description: text(1000),
  instagram_url: z.string().trim().max(300).url().or(z.literal("")),
  facebook_url: z.string().trim().max(300).url().or(z.literal("")),
  youtube_url: z.string().trim().max(300).url().or(z.literal("")),
  return_policy: text(5000),
  shipping_policy: text(5000),
  shipping_fee: money,
  free_shipping_above: z.coerce.number().min(0).max(10000000).or(z.literal("")).transform((v) => (v === "" || v === 0 ? null : v)),
  cod_enabled: z.boolean(),
  upi_enabled: z.boolean(),
  upi_id: z.string().trim().max(80).regex(/^$|^[\w.-]+@[\w.-]+$/, "Enter a valid UPI ID like name@bank"),
  upi_payee_name: text(80),
  low_stock_threshold: z.coerce.number().int().min(0).max(1000),
});

export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Please check the form";
