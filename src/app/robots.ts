import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/auth", "/admin"] },
    sitemap: "https://www.carkari.com/sitemap.xml",
  };
}
