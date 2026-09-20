import "server-only";

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN ?? "";
const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? "";
const VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";

export const instagramConfigured = () => Boolean(TOKEN && IG_ID);

/** Publishes a single-image post via the official Instagram Graph API (two steps: create container, publish). */
export async function publishImagePost(imageUrl: string, caption: string) {
  if (!instagramConfigured()) throw new Error("Instagram is not connected yet");
  const base = `https://graph.facebook.com/${VERSION}/${IG_ID}`;
  const c = await fetch(`${base}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: TOKEN }),
  });
  const cb = await c.json().catch(() => ({}));
  if (!c.ok || !cb.id) throw new Error(cb?.error?.message ?? "Instagram could not accept the image");
  const p = await fetch(`${base}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: cb.id, access_token: TOKEN }),
  });
  const pb = await p.json().catch(() => ({}));
  if (!p.ok || !pb.id) throw new Error(pb?.error?.message ?? "Instagram publish failed");
  return pb.id as string;
}
