export type Category = {
  id: string; name: string; slug: string; description: string | null;
  image_url: string | null; sort_order: number; is_active: boolean;
};
export type Subcategory = { id: string; category_id: string; name: string; slug: string; sort_order: number };
export type NamedItem = { id: string; name: string; sort_order?: number };
export type ProductImage = { id: string; url: string; is_main: boolean; sort_order: number; storage_path: string | null };

export type Product = {
  id: string; name: string; slug: string; sku: string; description: string;
  category_id: string | null; subcategory_id: string | null; fabric_id: string | null; work_type_id: string | null;
  price: number; mrp: number; stock: number; is_available: boolean;
  is_featured: boolean; is_new_arrival: boolean; is_best_seller: boolean;
  tags: string[]; sold_count: number; is_demo: boolean; created_at: string; updated_at: string;
  category: { id: string; name: string; slug: string } | null;
  subcategory: { id: string; name: string; slug: string } | null;
  fabric: { id: string; name: string } | null;
  work_type: { id: string; name: string } | null;
  images: ProductImage[];
};

export type Settings = {
  business_name: string; tagline: string | null;
  phone_primary: string | null; phone_secondary: string | null; whatsapp_number: string | null;
  email: string | null; maps_url: string | null; store_address: string | null; store_hours: string | null;
  store_description: string | null; logo_url: string | null;
  instagram_url: string | null; facebook_url: string | null; youtube_url: string | null;
  return_policy: string | null; shipping_policy: string | null;
  shipping_fee: number; free_shipping_above: number | null;
  cod_enabled: boolean; upi_enabled: boolean; upi_id: string | null; upi_payee_name: string | null; upi_qr_url: string | null;
  low_stock_threshold: number;
};

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PAYMENT_STATUSES = ["pending", "awaiting_verification", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = "cod" | "razorpay" | "upi";

export type OrderItem = {
  id: string; product_id: string | null; product_name: string; sku: string | null;
  image_url: string | null; unit_price: number; quantity: number; line_total: number;
};
export type Order = {
  id: string; order_number: string; public_token: string; customer_name: string; phone: string; email: string | null;
  address: string; city: string; state: string; pincode: string; notes: string | null;
  subtotal: number; shipping_fee: number; total: number;
  payment_method: PaymentMethod; payment_status: PaymentStatus; order_status: OrderStatus;
  razorpay_order_id: string | null; razorpay_payment_id: string | null; upi_reference: string | null;
  created_at: string; updated_at: string; items?: OrderItem[];
};
