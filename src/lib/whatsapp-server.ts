import "server-only";
import { createServiceSupabase } from "@/lib/supabase/server";
import { intlPhone, formatINR } from "@/lib/format";
import type { Order } from "@/lib/types";

const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";
const LANG = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";
export const WA_TEMPLATES = {
  confirmation: process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMATION || "order_confirmation",
  status: process.env.WHATSAPP_TEMPLATE_ORDER_STATUS || "order_status_update",
};

export const whatsappConfigured = () => Boolean(TOKEN && PHONE_ID);

type Result = { status: "sent" | "demo" | "failed"; detail: string };

/**
 * Sends an APPROVED template message through the official WhatsApp Cloud API.
 * Without credentials it runs in DEMO mode: nothing is sent, the message is only logged.
 */
export async function sendTemplate(to: string, template: string, params: string[], orderId?: string | null): Promise<Result> {
  const recipient = intlPhone(to);
  let result: Result;
  if (!whatsappConfigured()) {
    result = { status: "demo", detail: `Demo mode — would send "${template}" with: ${params.join(" | ")}` };
  } else {
    try {
      const res = await fetch(`https://graph.facebook.com/${VERSION}/${PHONE_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "template",
          template: {
            name: template,
            language: { code: template === "hello_world" ? "en_US" : LANG },
            ...(params.length ? { components: [{ type: "body", parameters: params.map((t) => ({ type: "text", text: t })) }] } : {}),
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      result = res.ok
        ? { status: "sent", detail: `Message id ${body?.messages?.[0]?.id ?? "?"}` }
        : { status: "failed", detail: body?.error?.message ?? `HTTP ${res.status}` };
    } catch (e) {
      result = { status: "failed", detail: (e as Error).message };
    }
  }
  try {
    await createServiceSupabase().from("notification_log").insert({
      channel: "whatsapp", order_id: orderId ?? null, recipient, template, status: result.status, detail: result.detail.slice(0, 500),
    });
  } catch { /* logging must never break an order */ }
  return result;
}

const STATUS_TEXT: Record<string, string> = {
  confirmed: "confirmed", processing: "being prepared", shipped: "dispatched",
  delivered: "delivered", cancelled: "cancelled", pending: "received",
};

/** Template body expected: "Hi {{1}}, your order {{2}} for {{3}} has been received. ..." */
export const notifyOrderPlaced = (o: Pick<Order, "id" | "phone" | "customer_name" | "order_number" | "total">) =>
  sendTemplate(o.phone, WA_TEMPLATES.confirmation, [o.customer_name, o.order_number, formatINR(o.total)], o.id);

/** Template body expected: "Hi {{1}}, your order {{2}} is now {{3}}. ..." */
export const notifyOrderStatus = (o: Pick<Order, "id" | "phone" | "customer_name" | "order_number">, status: string) =>
  sendTemplate(o.phone, WA_TEMPLATES.status, [o.customer_name, o.order_number, STATUS_TEXT[status] ?? status], o.id);
