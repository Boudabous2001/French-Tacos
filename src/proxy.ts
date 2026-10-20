import { NextResponse, type NextRequest } from "next/server";

/**
 * Filtre rapide du back-office : sans cookie de session, retour à la
 * connexion. La vraie vérification (session en base) est faite par chaque
 * page et chaque action côté serveur.
 */
const COOKIES_SESSION = ["__Host-ft_admin", "ft_admin"];

export function proxy(requete: NextRequest) {
  const { pathname } = requete.nextUrl;
  if (pathname === "/admin/connexion") return NextResponse.next();

  const connecte = COOKIES_SESSION.some((nom) => requete.cookies.has(nom));
  if (!connecte) {
    const url = requete.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const reponse = NextResponse.next();
  reponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  reponse.headers.set("Cache-Control", "no-store");
  return reponse;
}

export const config = {
  matcher: ["/admin/:chemin*"],
};
