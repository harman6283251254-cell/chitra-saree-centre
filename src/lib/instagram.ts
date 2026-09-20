import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

const tagify = (s: string) => "#" + s.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").map((w) => w[0]?.toUpperCase() + w.slice(1)).join("");

export function generateHashtags(p: Pick<Product, "category" | "subcategory" | "fabric" | "work_type" | "tags">) {
  const set = new Set<string>(["#ChitraSareeCentre", "#IndianEthnicWear", "#EthnicFashion"]);
  const add = (s?: string | null) => { if (s && s.toLowerCase() !== "other") set.add(tagify(s)); };
  add(p.category?.name); add(p.subcategory?.name); add(p.fabric?.name); add(p.work_type?.name);
  p.tags?.slice(0, 5).forEach(add);
  const cat = p.category?.slug ?? "";
  if (cat === "sarees") ["#Saree", "#SareeLove"].forEach((t) => set.add(t));
  if (cat === "lehengas") ["#Lehenga", "#BridalLehenga"].forEach((t) => set.add(t));
  if (cat === "suits") ["#SalwarSuit", "#PunjabiSuit"].forEach((t) => set.add(t));
  if (/wedding/i.test(`${p.subcategory?.name} ${p.tags?.join(" ")}`)) set.add("#WeddingWear");
  return Array.from(set).filter((t) => t.length > 2).slice(0, 15);
}

export function generateCaption(p: Product, productUrl: string, businessName: string) {
  const lines = [
    p.is_new_arrival ? "✨ New Arrival ✨" : "✨ Now available ✨",
    "",
    p.name,
    formatINR(p.price) + (Number(p.mrp) > Number(p.price) ? ` (MRP ${formatINR(p.mrp)})` : ""),
    [p.fabric?.name, p.work_type?.name].filter((x) => x && x !== "Other").join(" · ") || null,
    "",
    p.description ? p.description.split("\n")[0].slice(0, 220) : null,
    "",
    `Available now at ${businessName}. DM us for details or shop online:`,
    productUrl,
    "",
    generateHashtags(p).join(" "),
  ];
  return lines.filter((l) => l !== null).join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 2200);
}
