// Runs automatically before dev/build/start. Repairs common Windows .env.local
// problems (UTF-16 encoding from PowerShell redirection, BOM, CRLF) IN PLACE,
// without ever printing or logging the actual values.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const PATH = ".env.local";
if (!existsSync(PATH)) {
  console.log("[env-check] .env.local not found — copy .env.example to .env.local and fill in your Supabase keys.");
  process.exit(0);
}

const buf = readFileSync(PATH);

// Detect UTF-16 (common when a file is created via PowerShell `>` / Out-File,
// which defaults to UTF-16LE). Node reads files as UTF-8 by default, so a
// UTF-16 file decodes to garbage and every env var silently disappears.
function looksUtf16(b) {
  if (b.length >= 2 && ((b[0] === 0xff && b[1] === 0xfe) || (b[0] === 0xfe && b[1] === 0xff))) return true;
  // Heuristic: ASCII .env content in UTF-16LE has a 0x00 byte after every char.
  let zeros = 0;
  const sample = b.subarray(0, Math.min(b.length, 200));
  for (let i = 1; i < sample.length; i += 2) if (sample[i] === 0x00) zeros++;
  return zeros > sample.length / 2 - 5;
}

let text;
let fixed = false;

if (looksUtf16(buf)) {
  const le = buf[0] === 0xfe && buf[1] === 0xff ? "utf16be" : "utf16le"; // Node lacks utf16be; handle below
  if (le === "utf16be") {
    const swapped = Buffer.alloc(buf.length);
    for (let i = 0; i + 1 < buf.length; i += 2) { swapped[i] = buf[i + 1]; swapped[i + 1] = buf[i]; }
    text = swapped.toString("utf16le");
  } else {
    text = buf.toString("utf16le");
  }
  text = text.replace(/^\uFEFF/, "");
  fixed = true;
} else {
  text = buf.toString("utf8").replace(/^\uFEFF/, "");
}

// Normalize CRLF -> LF and strip stray carriage returns / trailing spaces on each line.
const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").map((l) => l.replace(/[ \t]+$/, "")).join("\n");

if (fixed || normalized !== buf.toString("utf8")) {
  writeFileSync(PATH, normalized, { encoding: "utf8" });
  if (fixed) console.log("[env-check] Fixed: .env.local was saved in UTF-16 (common with PowerShell) — converted to UTF-8.");
  else console.log("[env-check] Normalized line endings in .env.local.");
} else {
  console.log("[env-check] .env.local encoding OK.");
}

// Re-parse for a presence-only report (never print values).
const values = {};
for (const line of normalized.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) values[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}

// Auto-correct a common mistake: pasting the REST/Auth URL instead of the
// plain Project URL (e.g. https://xxx.supabase.co/rest/v1/ -> https://xxx.supabase.co)
let rewritten = normalized;
const rawUrl = values.NEXT_PUBLIC_SUPABASE_URL ?? "";
const urlMatch = rawUrl.match(/^https:\/\/[a-z0-9-]+\.supabase\.co/i);
if (urlMatch && urlMatch[0] !== rawUrl) {
  const cleanUrl = urlMatch[0];
  rewritten = rewritten.replace(
    /^NEXT_PUBLIC_SUPABASE_URL\s*=.*$/m,
    `NEXT_PUBLIC_SUPABASE_URL=${cleanUrl}`,
  );
  values.NEXT_PUBLIC_SUPABASE_URL = cleanUrl;
  writeFileSync(PATH, rewritten, { encoding: "utf8" });
  console.log("[env-check] Fixed: NEXT_PUBLIC_SUPABASE_URL had an extra path (like /rest/v1/) — trimmed to the plain project URL.");
}

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
let allGood = true;
for (const key of required) {
  const v = values[key] ?? "";
  const ok = v.length > 0 && !v.includes("your-project-id") && !v.includes("your-anon") && !v.includes("your-service");
  if (!ok) allGood = false;
  console.log(`[env-check] ${key}: ${ok ? "present ✓" : "MISSING or placeholder ✗"}`);
}
if (values.NEXT_PUBLIC_SUPABASE_URL && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(values.NEXT_PUBLIC_SUPABASE_URL)) {
  allGood = false;
  console.log("[env-check] NEXT_PUBLIC_SUPABASE_URL doesn't look like a Supabase project URL (expected https://<ref>.supabase.co).");
}
if (!allGood) {
  console.log("[env-check] Fix the items marked ✗ above in .env.local, then run: npm start");
}
