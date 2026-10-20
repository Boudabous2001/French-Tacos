import { ArrowRight, BellRing, Bike, ChefHat, Clock, Lock, MapPin, Phone, ShieldCheck, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { BoutonProduit } from "@/components/accueil/BoutonProduit";
import { Couronne } from "@/components/marque/Logo";
import { classesBouton } from "@/components/ui/Bouton";
import { Prix } from "@/components/ui/Prix";
import { euros } from "@/lib/argent";
import { prixDepart } from "@/lib/catalogue/prix";
import { JOURS, texteJour } from "@/lib/horaires";
import type { Reglages } from "@/lib/reglages-type";
import { lireCartePublique, lireReglages } from "@/lib/serveur/donnees";

export default function Accueil() {
  return (
    <>
      <Heros />
      <Suspense fallback={<SqueletteSections />}>
        <SectionsDynamiques />
      </Suspense>
      <CommentCaMarche />
      <Suspense fallback={null}>
        <InfosPratiques />
      </Suspense>
    </>
  );
}

function Heros() {
  return (
    <section className="grain relative overflow-hidden bg-nuit-900 text-creme">
      <div className="halo-neon pointer-events-none absolute inset-0 opacity-80" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pb-14 pt-6 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-24 md:pt-14">
        <div className="order-2 md:order-1">
          <p className="animate-apparition font-pinceau text-xl text-ambre-400 sm:text-2xl">Un max de goût</p>
          <h1 className="animate-apparition titre-display mt-2 text-[3.6rem] text-white [animation-delay:80ms] sm:text-7xl lg:text-[5.6rem]">
            Le tacos
            <br />
            <span className="text-braise-500 drop-shadow-[0_0_28px_rgb(251_106_11/0.55)]">généreux</span>
            <br />& gratiné
          </h1>
          <p className="animate-apparition mt-5 max-w-md text-[1.05rem] leading-relaxed text-creme/75 [animation-delay:160ms]">
            Tacos, burgers, sandwichs et assiettes préparés minute. Livrés chez toi bien chauds ou prêts à emporter.
          </p>
          <div className="animate-apparition mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
            <Link href="/carte" className={classesBouton("primaire", "lg")}>
              Commander maintenant <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="/infos" className={classesBouton("contour", "lg", "text-creme")}>
              Zones de livraison
            </Link>
          </div>
          <ul className="animate-apparition mt-8 flex flex-wrap gap-2 text-sm font-semibold [animation-delay:320ms]">
            {[
              { Icone: Clock, texte: "Prêt en ~20 min" },
              { Icone: Bike, texte: "Livraison rapide" },
              { Icone: Lock, texte: "Paiement sécurisé" },
            ].map(({ Icone, texte }) => (
              <li key={texte} className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-2 ring-1 ring-white/10">
                <Icone className="size-4 text-ambre-400" aria-hidden />
                {texte}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative order-1 mx-auto -mb-4 w-full max-w-[15.5rem] min-[400px]:max-w-[18rem] md:order-2 md:mb-0 md:max-w-[30rem]">
          <div className="absolute inset-[12%] animate-lueur rounded-full bg-braise-500/40 blur-[70px]" aria-hidden />
          <div className="relative animate-flotte">
            <Image
              src="/images/marque/enseigne.webp"
              alt="Enseigne lumineuse French Tacos"
              width={900}
              height={904}
              priority
              sizes="(min-width: 768px) 30rem, 22rem"
              className="animate-scintille [mask-image:radial-gradient(circle_at_50%_47%,black_46%,transparent_68%)]"
            />
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-nuit-900/80" aria-hidden />
    </section>
  );
}

async function SectionsDynamiques() {
  await connection();
  const carte = await lireCartePublique();
  const tacos = carte.produits.filter((p) => p.categorieId === "tacos");
  const categories = carte.categories.filter((c) => carte.produits.some((p) => p.categorieId === c.id));

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6" aria-labelledby="titre-envies">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-pinceau text-lg text-braise-600">Envie de quoi ?</p>
            <h2 id="titre-envies" className="titre-display text-4xl sm:text-5xl">
              Toute la carte
            </h2>
          </div>
          <Link href="/carte" className="hidden items-center gap-1 text-sm font-bold text-braise-600 hover:text-braise-700 sm:flex">
            Tout voir <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="barre-defilement-fine -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
          {categories.map((c) => (
            <li key={c.id} className="w-36 shrink-0 snap-start sm:w-auto">
              <Link
                href={`/carte#${c.id}`}
                className="group block overflow-hidden rounded-[1.5rem] bg-white shadow-carte ring-1 ring-ligne transition duration-300 hover:-translate-y-1 hover:ring-braise-300"
              >
                <span className="relative block aspect-square bg-sable">
                  {c.image && (
                    <Image src={c.image} alt="" fill sizes="(min-width: 640px) 20vw, 144px" className="object-cover transition duration-500 group-hover:scale-110" />
                  )}
                </span>
                <span className="flex items-center justify-between px-3.5 py-3">
                  <span className="titre-display text-lg">{c.nom}</span>
                  <ArrowRight className="size-4 -translate-x-1 text-braise-500 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {tacos.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6" aria-labelledby="titre-tacos">
          <div className="grain relative overflow-hidden rounded-[2rem] bg-braise-500 px-5 py-10 text-white sm:px-10 sm:py-14">
            <Couronne className="pointer-events-none absolute -right-8 -top-6 h-40 w-64 rotate-12 text-white/10" />
            <p className="font-pinceau text-xl text-nuit-900/80">La spécialité de la maison</p>
            <h2 id="titre-tacos" className="titre-display text-5xl sm:text-6xl">
              Compose ton tacos
            </h2>
            <p className="mt-3 max-w-xl text-white/90">
              Choisis ta taille, tes viandes, tes sauces, ajoute tes suppléments. Galette grillée, frites et sauce fromagère : on s&apos;occupe du reste.
            </p>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3">
              {tacos.map((t, i) => (
                <li key={t.id}>
                  <BoutonProduit
                    produitId={t.id}
                    libelle={`Composer un ${t.nom}`}
                    className="group flex w-full items-center gap-4 rounded-[1.5rem] bg-white p-3 text-left text-encre shadow-[0_20px_40px_-20px_rgb(0_0_0/0.5)] transition duration-300 hover:-translate-y-1 hover:rotate-[-0.5deg]"
                  >
                    <span className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-sable">
                      {t.image && <Image src={t.image} alt="" fill sizes="96px" className="object-cover transition duration-500 group-hover:scale-110" />}
                    </span>
                    <span className="flex-1">
                      <span className="titre-display block text-2xl">{t.nom.replace(/^Tacos /, "")}</span>
                      <span className="block text-sm text-gris">
                        {i + 1} viande{i > 0 ? "s" : ""} au choix
                      </span>
                      <Prix montant={prixDepart(t)} className="titre-display mt-1 text-3xl text-braise-600" />
                    </span>
                  </BoutonProduit>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </>
  );
}

function SqueletteSections() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6" aria-hidden>
      <div className="h-10 w-56 animate-pulse rounded-xl bg-sable" />
      <div className="mt-6 flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="aspect-[4/5] w-36 shrink-0 animate-pulse rounded-[1.5rem] bg-sable sm:flex-1" />
        ))}
      </div>
      <div className="mt-16 h-80 animate-pulse rounded-[2rem] bg-sable" />
    </div>
  );
}

function CommentCaMarche() {
  const etapes = [
    { Icone: ChefHat, titre: "Compose", texte: "Taille, viandes, sauces, suppléments : ton tacos, à ta façon." },
    { Icone: ShieldCheck, titre: "Paie en sécurité", texte: "Carte bancaire, Apple Pay ou Google Pay. Ou sur place si tu préfères." },
    { Icone: BellRing, titre: "Suis en direct", texte: "Commande reçue, en préparation, en route : tu sais tout, en temps réel." },
  ];
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6" aria-labelledby="titre-etapes">
      <p className="font-pinceau text-lg text-braise-600">Simple comme bonjour</p>
      <h2 id="titre-etapes" className="titre-display text-4xl sm:text-5xl">
        Comment ça marche
      </h2>
      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
        {etapes.map(({ Icone, titre, texte }, i) => (
          <li key={titre} className="relative overflow-hidden rounded-[1.75rem] bg-white p-6 shadow-carte ring-1 ring-ligne">
            <span className="titre-display pointer-events-none absolute -right-2 -top-6 text-[7rem] text-sable" aria-hidden>
              {i + 1}
            </span>
            <span className="relative grid size-12 place-items-center rounded-2xl bg-nuit-900 text-ambre-400">
              <Icone className="size-6" aria-hidden />
            </span>
            <h3 className="relative mt-4 text-xl font-extrabold">{titre}</h3>
            <p className="relative mt-1.5 text-gris">{texte}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex items-center gap-3 rounded-[1.5rem] bg-sable p-4 text-sm">
        <Smartphone className="size-5 shrink-0 text-braise-600" aria-hidden />
        <p>
          <strong>Astuce :</strong> ajoute le site à ton écran d&apos;accueil pour commander en deux touches, comme une appli.
        </p>
      </div>
    </section>
  );
}

async function InfosPratiques() {
  await connection();
  const reglages = await lireReglages();
  const { restaurant, horaires, zones, modes } = reglages;
  const zonesActives = zones.filter((z) => z.active);
  return (
    <section className="mx-auto mt-20 grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2" aria-labelledby="titre-infos">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: donneesStructurees(reglages) }} />
      <h2 id="titre-infos" className="sr-only">
        Infos pratiques
      </h2>
      <div className="rounded-[1.75rem] bg-nuit-900 p-6 text-creme sm:p-8">
        <h3 className="titre-display text-3xl text-white">Horaires</h3>
        <dl className="mt-5 space-y-2">
          {JOURS.map((jour) => (
            <div key={jour} className="flex justify-between gap-4 border-b border-white/5 pb-2 text-sm last:border-0">
              <dt className="capitalize text-creme/70">{jour}</dt>
              <dd className="text-right font-semibold tabular-nums">{texteJour(horaires[jour])}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 space-y-2 text-sm">
          <p className="flex gap-2">
            <MapPin className="size-4 shrink-0 text-ambre-400" aria-hidden />
            {restaurant.adresse}, {restaurant.codePostal} {restaurant.ville}
          </p>
          <a href={`tel:${restaurant.telephone.replace(/\s/g, "")}`} className="flex gap-2 hover:text-white">
            <Phone className="size-4 shrink-0 text-ambre-400" aria-hidden />
            {restaurant.telephone}
          </a>
        </div>
      </div>
      <div className="rounded-[1.75rem] bg-white p-6 shadow-carte ring-1 ring-ligne sm:p-8">
        <h3 className="titre-display text-3xl">{modes.livraison ? "On livre chez toi" : "À emporter"}</h3>
        {modes.livraison && zonesActives.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {zonesActives.map((z) => (
              <li key={z.id} className="rounded-2xl bg-sable p-4">
                <p className="font-bold">{z.communes.map((c) => c.nom).join(", ")}</p>
                <p className="mt-1 text-sm text-gris">
                  Livraison {z.frais === 0 ? "offerte" : euros(z.frais)} · minimum {euros(z.minimum)}
                  {z.gratuiteDes !== null && z.frais > 0 ? ` · offerte dès ${euros(z.gratuiteDes)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-gris">Commande en ligne et récupère ta commande au comptoir, sans attendre.</p>
        )}
        <Link href="/carte" className={classesBouton("sombre", "md", "mt-6")}>
          Je commande <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

/** Fiche « Restaurant » lue par Google (horaires, adresse, commande en ligne). */
function donneesStructurees({ restaurant, horaires, reseaux }: Reglages) {
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  const jours = { lundi: "Monday", mardi: "Tuesday", mercredi: "Wednesday", jeudi: "Thursday", vendredi: "Friday", samedi: "Saturday", dimanche: "Sunday" };
  const donnees = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.nom,
    image: `${site}/images/marque/partage.jpg`,
    url: site,
    telephone: restaurant.telephone,
    servesCuisine: ["Tacos", "Burgers", "Sandwichs", "Fast-food"],
    priceRange: "€",
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.adresse,
      postalCode: restaurant.codePostal,
      addressLocality: restaurant.ville,
      addressCountry: "FR",
    },
    ...(restaurant.latitude !== null && restaurant.longitude !== null
      ? { geo: { "@type": "GeoCoordinates", latitude: restaurant.latitude, longitude: restaurant.longitude } }
      : {}),
    openingHoursSpecification: JOURS.flatMap((jour) =>
      horaires[jour].map((p) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: jours[jour], opens: p.debut, closes: p.fin })),
    ),
    hasMenu: `${site}/carte`,
    potentialAction: { "@type": "OrderAction", target: `${site}/carte`, deliveryMethod: ["http://purl.org/goodrelations/v1#DeliveryModeOwnFleet", "http://purl.org/goodrelations/v1#DeliveryModePickUp"] },
    sameAs: Object.values(reseaux).filter(Boolean),
  };
  // Empêche toute fermeture prématurée de la balise script.
  return JSON.stringify(donnees).replace(/</g, "\\u003c");
}
