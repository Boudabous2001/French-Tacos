import type { MetadataRoute } from "next";

/** Le site s'installe sur l'écran d'accueil du téléphone, comme une appli. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "French Tacos",
    short_name: "French Tacos",
    description: "Commande tes tacos, burgers et sandwichs en livraison ou à emporter.",
    lang: "fr",
    start_url: "/carte",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#120a06",
    theme_color: "#120a06",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-masquable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
