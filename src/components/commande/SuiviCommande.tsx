"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { Bike, Check, ChefHat, LoaderCircle, Package, Phone, Receipt, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { classesBouton } from "@/components/ui/Bouton";
import { euros } from "@/lib/argent";
import { heureParis, jourParis, partiesParis } from "@/lib/horaires";
import type { SuiviPublic } from "@/lib/serveur/commandes";
import { usePanier } from "@/stores/panier";
import { useInterface } from "@/stores/interface";

const TERMINES = new Set(["terminee", "annulee"]);

export function SuiviCommande({ jeton }: { jeton: string }) {
  const [suivi, setSuivi] = useState<SuiviPublic | null>(null);
  const [introuvable, setIntrouvable] = useState(false);
  const reglages = useInterface((e) => e.reglages);

  useEffect(() => {
    let actif = true;
    let minuteur: number | undefined;
    const charger = async () => {
      try {
        const reponse = await fetch(`/api/commandes/${jeton}`, { cache: "no-store" });
        if (reponse.status === 404) {
          if (actif) setIntrouvable(true);
          return;
        }
        if (reponse.ok) {
          const donnees = (await reponse.json()) as SuiviPublic;
          if (!actif) return;
          setSuivi(donnees);
          if (TERMINES.has(donnees.statut)) return;
        }
      } catch {
        /* réseau instable : on réessaie */
      }
      if (actif) minuteur = window.setTimeout(charger, document.hidden ? 20_000 : 6_000);
    };
    void charger();
    const auRetour = () => {
      if (!document.hidden) {
        window.clearTimeout(minuteur);
        void charger();
      }
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      actif = false;
      window.clearTimeout(minuteur);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [jeton]);

  // Commande confirmée : le panier peut être vidé.
  useEffect(() => {
    if (!suivi || suivi.statut === "attente_paiement" || suivi.statut === "annulee") return;
    const { derniereCommande, vider, memoriserCommande } = usePanier.getState();
    if (derniereCommande === jeton) {
      vider();
      memoriserCommande(null);
    }
  }, [suivi, jeton]);

  if (introuvable) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="titre-display text-5xl">Commande introuvable</h1>
        <p className="mt-3 text-gris">Ce lien de suivi n&apos;est pas valide. Vérifie le lien reçu par e-mail ou appelle le restaurant.</p>
        <Link href="/" className={classesBouton("primaire", "lg", "mt-8")}>
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (!suivi) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-lg place-items-center px-4" aria-busy="true">
        <LoaderCircle className="size-10 animate-spin text-braise-500" aria-label="Chargement du suivi" />
      </div>
    );
  }

  const livraison = suivi.mode === "livraison";
  const etapes = livraison
    ? [
        { cle: "nouvelle", titre: "Reçue", Icone: Receipt },
        { cle: "acceptee", titre: "En cuisine", Icone: ChefHat },
        { cle: "en_livraison", titre: "En route", Icone: Bike },
        { cle: "terminee", titre: "Livrée", Icone: Package },
      ]
    : [
        { cle: "nouvelle", titre: "Reçue", Icone: Receipt },
        { cle: "acceptee", titre: "En cuisine", Icone: ChefHat },
        { cle: "prete", titre: "Prête", Icone: ShoppingBag },
        { cle: "terminee", titre: "Récupérée", Icone: Store },
      ];
  const ordre = livraison ? ["nouvelle", "acceptee", "prete", "en_livraison", "terminee"] : ["nouvelle", "acceptee", "prete", "terminee"];
  const rang = ordre.indexOf(suivi.statut);
  const indexEtape = etapes.reduce((dernier, e, i) => (ordre.indexOf(e.cle) <= rang ? i : dernier), -1);
  const telephone = reglages?.restaurant.telephone;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grain relative overflow-hidden rounded-[2rem] bg-nuit-900 p-6 text-creme sm:p-9"
        aria-live="polite"
      >
        <div className="halo-neon pointer-events-none absolute -right-20 -top-24 h-72 w-96 opacity-80" aria-hidden />
        <p className="relative text-sm font-semibold text-creme/60">Commande n° {suivi.numero}</p>
        <AnimatePresence mode="wait">
          <motion.h1
            key={suivi.statut}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="titre-display relative mt-2 text-5xl text-white sm:text-6xl"
          >
            {titreStatut(suivi)}
          </motion.h1>
        </AnimatePresence>
        <p className="relative mt-3 max-w-md text-creme/75">{sousTitre(suivi)}</p>

        {suivi.statut !== "annulee" && suivi.statut !== "attente_paiement" && (
          <ol className="relative mt-8 grid grid-cols-4 gap-2">
            <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-white/10" aria-hidden>
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-ambre-400 to-braise-500"
                initial={{ width: 0 }}
                animate={{ width: `${(Math.max(indexEtape, 0) / (etapes.length - 1)) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            {etapes.map(({ cle, titre, Icone }, i) => {
              const fait = i < indexEtape || (i === indexEtape && suivi.statut === "terminee");
              const courant = i === indexEtape && suivi.statut !== "terminee";
              return (
                <li key={cle} className="relative flex flex-col items-center text-center">
                  <motion.span
                    animate={courant ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                    transition={courant ? { repeat: Infinity, duration: 1.8 } : undefined}
                    className={clsx(
                      "grid size-11 place-items-center rounded-full ring-4 ring-nuit-900 transition-colors duration-500",
                      fait ? "bg-ambre-400 text-nuit-900" : courant ? "bg-braise-500 text-white shadow-neon" : "bg-nuit-700 text-creme/40",
                    )}
                  >
                    {fait ? <Check className="size-5" strokeWidth={3} aria-hidden /> : <Icone className="size-5" aria-hidden />}
                  </motion.span>
                  <span className={clsx("mt-2 text-xs font-bold sm:text-sm", fait || courant ? "text-creme" : "text-creme/40")}>{titre}</span>
                </li>
              );
            })}
          </ol>
        )}

        {suivi.statut === "attente_paiement" && (
          <div className="relative mt-6 flex items-center gap-3 text-sm font-semibold text-ambre-300">
            <LoaderCircle className="size-5 animate-spin" aria-hidden /> Vérification du paiement…
          </div>
        )}
      </motion.section>

      {telephone && (
        <a href={`tel:${telephone.replace(/\s/g, "")}`} className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-carte ring-1 ring-ligne">
          <span className="flex items-center gap-3 font-bold">
            <Phone className="size-5 text-braise-500" aria-hidden /> Une question ? Appelle le restaurant
          </span>
          <span className="whitespace-nowrap text-sm font-semibold text-gris">{telephone}</span>
        </a>
      )}

      <section className="mt-4 rounded-[1.75rem] bg-white p-5 shadow-carte ring-1 ring-ligne sm:p-6" aria-labelledby="titre-detail">
        <h2 id="titre-detail" className="text-lg font-extrabold">
          Détail de la commande
        </h2>
        {suivi.adresse && <p className="mt-1 text-sm text-gris">Livraison : {suivi.adresse}</p>}
        <ul className="mt-4 divide-y divide-ligne">
          {suivi.lignes.map((l, i) => (
            <li key={i} className="flex justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-bold">
                  {l.quantite} × {l.nom}
                  {l.varianteNom && <span className="font-semibold text-gris"> · {l.varianteNom}</span>}
                </p>
                {l.details && <p className="text-xs text-gris">{l.details}</p>}
              </div>
              <span className="font-bold tabular-nums">{euros(l.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t border-ligne pt-3 text-sm">
          {suivi.fraisLivraison > 0 && (
            <div className="flex justify-between">
              <dt className="text-gris">Livraison</dt>
              <dd className="tabular-nums">{euros(suivi.fraisLivraison)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold">
            <dt>Total</dt>
            <dd className="tabular-nums">{euros(suivi.total)}</dd>
          </div>
          <div className="flex justify-between text-xs text-gris">
            <dt>Paiement</dt>
            <dd>{libellePaiement(suivi)}</dd>
          </div>
        </dl>
      </section>

      {TERMINES.has(suivi.statut) && (
        <div className="mt-6 text-center">
          <Link href="/carte" className={classesBouton("primaire", "lg")}>
            Commander à nouveau
          </Link>
        </div>
      )}
    </div>
  );
}

function heureRelative(iso: string) {
  const instant = new Date(iso);
  const memeJour = partiesParis(instant).date === partiesParis(new Date()).date;
  return memeJour ? heureParis(instant) : `${jourParis(instant)} à ${heureParis(instant)}`;
}

function titreStatut(s: SuiviPublic) {
  switch (s.statut) {
    case "attente_paiement":
      return "Presque fini…";
    case "nouvelle":
      return "Commande reçue !";
    case "acceptee":
      return "En cuisine 🔥";
    case "prete":
      return s.mode === "livraison" ? "Prête, on part !" : "C'est prêt !";
    case "en_livraison":
      return "En route !";
    case "terminee":
      return "Bon appétit !";
    case "annulee":
      return "Commande annulée";
  }
}

function sousTitre(s: SuiviPublic) {
  switch (s.statut) {
    case "attente_paiement":
      return s.paiementStatut === "echoue" ? "Le paiement n'a pas abouti. Tu peux réessayer depuis ton panier." : "Nous attendons la confirmation de ta banque.";
    case "nouvelle":
      return s.creneau
        ? `Le restaurant valide ta commande, prévue pour ${heureRelative(s.creneau)}.`
        : "Le restaurant valide ta commande. Tu seras informé ici en direct.";
    case "acceptee":
      return s.pretePrevueA ? `Ta commande sera prête vers ${heureRelative(s.pretePrevueA)}.` : "Ta commande est en préparation.";
    case "prete":
      return s.mode === "livraison" ? "Ton livreur récupère ta commande." : "Présente-toi au comptoir avec ton numéro de commande.";
    case "en_livraison":
      return "Ton livreur est en chemin. Garde ton téléphone à portée de main.";
    case "terminee":
      return `Merci ${s.clientPrenom} ! À très vite chez French Tacos.`;
    case "annulee":
      return `${s.motifAnnulation ?? "Ta commande a été annulée."}${s.paiementStatut === "rembourse" ? " Le remboursement est en cours (5 à 10 jours)." : ""}`;
  }
}

function libellePaiement(s: SuiviPublic) {
  if (s.paiementStatut === "rembourse") return "Remboursé";
  if (s.paiementMode === "en_ligne") return s.paiementStatut === "paye" ? "Payé en ligne" : "En ligne · en attente";
  return s.paiementStatut === "paye" ? "Réglé sur place" : `À régler ${s.mode === "livraison" ? "au livreur" : "au comptoir"}`;
}
