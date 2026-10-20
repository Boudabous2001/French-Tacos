import type { Metadata, Viewport } from "next";
import { Anton, Permanent_Marker, Plus_Jakarta_Sans } from "next/font/google";

import { Fournisseurs } from "@/components/Fournisseurs";
import "./globals.css";

// Polices auto-hébergées par Next : aucun appel à Google depuis le navigateur (RGPD).
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-marker", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

const SITE = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "French Tacos – Tacos, burgers et sandwichs en livraison ou à emporter",
    template: "%s · French Tacos",
  },
  description:
    "Commande en ligne tes French Tacos, burgers, sandwichs, assiettes et tex-mex. Livraison rapide ou à emporter, paiement sécurisé et suivi de commande en direct.",
  applicationName: "French Tacos",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "French Tacos",
    images: [{ url: "/images/marque/partage.jpg", width: 1200, height: 630, alt: "Enseigne lumineuse French Tacos" }],
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: "French Tacos", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#120a06",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${anton.variable} ${marker.variable} ${jakarta.variable} h-full`}>
      <body className="min-h-full">
        <Fournisseurs>{children}</Fournisseurs>
      </body>
    </html>
  );
}
