import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { estSiteDeTest } from "@/lib/environnement";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Lu à chaque requête : le même build sert le site réel et le serveur de démonstration.
  await connection();
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  if (estSiteDeTest()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/commande", "/suivi"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
