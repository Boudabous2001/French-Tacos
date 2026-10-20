import { NextResponse, type NextRequest } from "next/server";

import { estSiteDeTest } from "@/lib/environnement";

/**
 * Filtre exécuté avant chaque page :
 * - back-office : sans cookie de session, retour à la connexion (la vraie
 *   vérification, en base, est refaite par chaque page et chaque action) ;
 * - serveur de démonstration : aucune page n'est indexée par les moteurs.
 */
const COOKIES_SESSION = ["__Host-ft_admin", "ft_admin"];

export function proxy(requete: NextRequest) {
  const { pathname } = requete.nextUrl;
  const backOffice = pathname === "/admin" || pathname.startsWith("/admin/");

  if (backOffice && pathname !== "/admin/connexion" && !COOKIES_SESSION.some((nom) => requete.cookies.has(nom))) {
    const url = requete.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const reponse = NextResponse.next();
  if (backOffice) {
    reponse.headers.set("Cache-Control", "no-store");
  }
  if (backOffice || estSiteDeTest()) {
    reponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return reponse;
}

export const config = {
  // Toutes les pages, sauf les fichiers statiques.
  matcher: ["/((?!_next/static|_next/image|images/|icones/|favicon.ico|icon.svg|apple-icon.png).*)"],
};
