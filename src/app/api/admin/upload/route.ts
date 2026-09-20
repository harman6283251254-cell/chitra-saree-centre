import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdmin } from "@/lib/auth";
import { SUPABASE_URL } from "@/lib/env";

const MAX = 5 * 1024 * 1024;
// Check the real file content (magic bytes), not just the file name.
function detect(buf: Uint8Array): { ext: string; mime: string } | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (String.fromCharCode(...buf.slice(0, 4)) === "RIFF" && String.fromCharCode(...buf.slice(8, 12)) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folder = form?.get("folder") === "branding" ? "branding" : "products";
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo received." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Photo is larger than 5 MB." }, { status: 400 });

  const buf = new Uint8Array(await file.arrayBuffer());
  const type = detect(buf);
  if (!type) return NextResponse.json({ error: "Only JPG, PNG or WebP photos are allowed." }, { status: 400 });

  const path = `${folder}/${new Date().getFullYear()}/${randomUUID()}.${type.ext}`;
  const { error } = await admin.sb.storage.from("product-images").upload(path, buf, { contentType: type.mime, cacheControl: "31536000", upsert: false });
  if (error) return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });

  return NextResponse.json({ url: `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`, path });
}
