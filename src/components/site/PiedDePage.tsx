import { CreditCard, Lock, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { Logo } from "@/components/marque/Logo";
import { IconeFacebook, IconeInstagram, IconeSnapchat, IconeTiktok } from "@/components/marque/Reseaux";
import { JOURS, texteJour } from "@/lib/horaires";
import { lireReglages } from "@/lib/serveur/donnees";

const LIENS_LEGAUX = [
  { href: "/mentions-legales", libelle: "Mentions légales" },
  { href: "/cgv", libelle: "Conditions générales de vente" },
  { href: "/confidentialite", libelle: "Confidentialité" },
  { href: "/allergenes", libelle: "Allergènes" },
];

export async function PiedDePage() {
  await connection();
  const { restaurant, horaires, reseaux } = await lireReglages();
  const telephone = restaurant.telephone.replace(/\s/g, "");
  const reseauxActifs = [
    { url: reseaux.instagram, nom: "Instagram", Icone: IconeInstagram },
    { url: reseaux.facebook, nom: "Facebook", Icone: IconeFacebook },
    { url: reseaux.tiktok, nom: "TikTok", Icone: IconeTiktok },
    { url: reseaux.snapchat, nom: "Snapchat", Icone: IconeSnapchat },
  ].filter((r) => r.url);

  return (
    <footer className="grain relative mt-24 overflow-hidden bg-nuit-900 text-creme/80">
      <div className="halo-neon pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 opacity-60" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo taille="lg" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">{restaurant.slogan}</p>
          {reseauxActifs.length > 0 && (
            <div className="mt-6 flex gap-2">
              {reseauxActifs.map(({ url, nom, Icone }) => (
                <a
                  key={nom}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-10 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10 transition hover:bg-braise-500 hover:text-white"
                  aria-label={`${restaurant.nom} sur ${nom}`}
                >
                  <Icone className="size-[1.1rem]" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="titre-display text-lg text-white">Horaires</h2>
          <dl className="mt-4 space-y-1.5 text-sm">
            {JOURS.map((jour) => (
              <div key={jour} className="flex justify-between gap-4">
                <dt className="capitalize">{jour}</dt>
                <dd className="text-right tabular-nums text-creme">{texteJour(horaires[jour])}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="titre-display text-lg text-white">Nous trouver</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ambre-400" aria-hidden />
              <span>
                {restaurant.adresse}
                <br />
                {restaurant.codePostal} {restaurant.ville}
              </span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-ambre-400" aria-hidden />
              <a href={`tel:${telephone}`} className="hover:text-white">
                {restaurant.telephone}
              </a>
            </li>
          </ul>
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white/[0.05] p-3 text-xs ring-1 ring-white/10">
            <Lock className="size-4 shrink-0 text-ambre-400" aria-hidden />
            <span>Paiement sécurisé par carte, Apple Pay et Google Pay</span>
            <CreditCard className="ml-auto size-4 shrink-0 opacity-60" aria-hidden />
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {restaurant.nom} · {restaurant.ville}
          </p>
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-2">
            {LIENS_LEGAUX.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.libelle}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function PiedDePageSquelette() {
  return <footer className="mt-24 h-96 bg-nuit-900" aria-hidden />;
}
