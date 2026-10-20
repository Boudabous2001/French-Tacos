import type { MetadataRoute } from "next";

const PAGES: { chemin: string; priorite: number; frequence: "daily" | "weekly" | "monthly" }[] = [
  { chemin: "/", priorite: 1, frequence: "weekly" },
  { chemin: "/carte", priorite: 0.9, frequence: "daily" },
  { chemin: "/infos", priorite: 0.7, frequence: "monthly" },
  { chemin: "/allergenes", priorite: 0.4, frequence: "monthly" },
  { chemin: "/mentions-legales", priorite: 0.1, frequence: "monthly" },
  { chemin: "/cgv", priorite: 0.1, frequence: "monthly" },
  { chemin: "/confidentialite", priorite: 0.1, frequence: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  return PAGES.map((p) => ({ url: `${site}${p.chemin}`, changeFrequency: p.frequence, priority: p.priorite }));
}
