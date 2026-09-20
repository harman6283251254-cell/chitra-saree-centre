import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/order/", "/checkout", "/cart"] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
