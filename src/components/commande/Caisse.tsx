"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Banknote, Bike, CalendarClock, CircleAlert, Clock, CreditCard, Lock, MapPin, PauseCircle, Store, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { EtapePaiement, type Paiement } from "@/components/commande/EtapePaiement";
import { ChampAdresse } from "@/components/commande/ChampAdresse";
import { Bouton, classesBouton } from "@/components/ui/Bouton";
import { Compteur } from "@/components/ui/Compteur";
import { euros } from "@/lib/argent";
import { evaluerSelection, texteResume } from "@/lib/catalogue/prix";
import type { Carte } from "@/lib/catalogue/types";
import { REGEX_TELEPHONE, type CommandeEntree } from "@/lib/commande-schema";
import { heureParis, jourParis, partiesParis, type Creneau } from "@/lib/horaires";
import type { ReglagesPublics } from "@/lib/reglages-type";
import { sousTotalPanier, usePanier } from "@/stores/panier";
import { useInterface } from "@/stores/interface";

interface Disponibilite {
  maintenant: string;
  ouvert: boolean;
  fermeA: string | null;
  ouvreA: string | null;
  enPause: boolean;
  messagePause: string;
  desQuePossible: boolean;
  delaiMinutes: number;
  creneaux: Creneau[];
}

interface Props {
  carte: Carte;
  reglages: ReglagesPublics;
  paiementEnLigne: "stripe" | "demo" | "indisponible";
  cleStripe: string | null;
}

export function Caisse({ carte, reglages, paiementEnLigne, cleStripe }: Props) {
  const router = useRouter();
  const hydrate = useInterface((e) => e.panierHydrate);
  const notifier = useInterface((e) => e.notifier);
  const { lignes, mode, adresse, client, choisirMode, choisirAdresse, remplacerLignes, changerQuantite, memoriserCommande, vider, modifierClient } = usePanier();

  const [complement, setComplement] = useState("");
  const [instructions, setInstructions] = useState("");
  const [quandChoisi, setQuand] = useState<"asap" | "plus-tard">("asap");
  const [creneauChoisi, setCreneau] = useState<string | null>(null);
  const setClient = modifierClient;
  const [note, setNote] = useState("");
  const enLignePossible = reglages.paiement.enLigne && paiementEnLigne !== "indisponible";
  const [paiement, setPaiement] = useState<"en_ligne" | "sur_place">(enLignePossible ? "en_ligne" : "sur_place");
  const [cgv, setCgv] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [dispo, setDispo] = useState<Disponibilite | null>(null);
  const [etape, setEtape] = useState<{ jeton: string; numero: number; total: number; paiement: Paiement } | null>(null);
  const formulaire = useRef<HTMLFormElement>(null);

  /* --- Modes autorisés --- */
  useEffect(() => {
    if (!reglages.modes[mode]) choisirMode(mode === "livraison" ? "emporter" : "livraison");
  }, [mode, reglages.modes, choisirMode]);

  /* --- Panier revérifié avec la carte du jour --- */
  const problemes = useMemo(() => {
    const resultat = new Map<string, string>();
    for (const ligne of lignes) {
      const produit = carte.produits.find((p) => p.id === ligne.produitId);
      if (!produit) {
        resultat.set(ligne.cle, "N'est plus à la carte");
        continue;
      }
      const evaluation = evaluerSelection(produit, ligne.selection, carte.listes);
      if (!evaluation.ok) resultat.set(ligne.cle, evaluation.erreurs[0].message);
    }
    return resultat;
  }, [lignes, carte]);

  useEffect(() => {
    if (!hydrate) return;
    let modifie = false;
    const misesAJour = lignes.map((ligne) => {
      const produit = carte.produits.find((p) => p.id === ligne.produitId);
      if (!produit) return ligne;
      const evaluation = evaluerSelection(produit, ligne.selection, carte.listes);
      if (evaluation.ok && evaluation.prixUnitaire !== ligne.prixUnitaire) {
        modifie = true;
        return { ...ligne, prixUnitaire: evaluation.prixUnitaire, details: texteResume(evaluation.resume) };
      }
      return ligne;
    });
    if (modifie) {
      remplacerLignes(misesAJour);
      notifier("Les prix de ton panier ont été mis à jour", "info");
    }
    // Uniquement à l'arrivée sur la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrate]);

  /* --- Ouverture et créneaux (heure du serveur) --- */
  const zone = mode === "livraison" ? (adresse?.zone ?? null) : null;
  useEffect(() => {
    let actif = true;
    const charger = async () => {
      try {
        const reponse = await fetch(`/api/disponibilite?mode=${mode}${zone ? `&zone=${zone.id}` : ""}`, { cache: "no-store" });
        if (reponse.ok && actif) setDispo((await reponse.json()) as Disponibilite);
      } catch {
        /* réseau coupé : on réessaie au prochain passage */
      }
    };
    void charger();
    const minuteur = window.setInterval(charger, 60_000);
    return () => {
      actif = false;
      window.clearInterval(minuteur);
    };
  }, [mode, zone]);

  // « Dès que possible » n'est plus proposable : on bascule sur un créneau ; un créneau dépassé est oublié.
  const quand = dispo && !dispo.desQuePossible ? "plus-tard" : quandChoisi;
  const creneau = creneauChoisi && (!dispo || dispo.creneaux.some((c) => c.iso === creneauChoisi)) ? creneauChoisi : null;

  /* --- Montants --- */
  const sousTotal = sousTotalPanier(lignes);
  const frais = zone ? (zone.gratuiteDes !== null && sousTotal >= zone.gratuiteDes ? 0 : zone.frais) : 0;
  const total = sousTotal + frais;
  const minimum = mode === "livraison" ? (zone?.minimum ?? 0) : reglages.commandes.minimumEmporter;

  const valider = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (lignes.length === 0) e.lignes = "Ton panier est vide.";
    else if (problemes.size > 0) e.lignes = "Certains articles ne sont plus disponibles : retire-les du panier.";
    else if (sousTotal < minimum) e.lignes = `Minimum de commande : ${euros(minimum)}.`;
    if (mode === "livraison") {
      if (!adresse) e.adresse = "Indique ton adresse de livraison.";
      else if (!adresse.zone) e.adresse = "Cette adresse est hors zone de livraison.";
    }
    if (quand === "plus-tard" && !creneau) e.creneau = "Choisis un créneau.";
    if (!client.prenom.trim()) e.prenom = "Ton prénom, pour t'appeler au comptoir.";
    if (!REGEX_TELEPHONE.test(client.telephone.trim())) e.telephone = "Un numéro de mobile valide, au cas où.";
    if (client.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(client.email.trim())) e.email = "Cette adresse e-mail semble incorrecte.";
    if (!cgv) e.cgv = "Merci d'accepter les conditions générales de vente.";
    return e;
  };

  const envoyer = async (evenement: React.FormEvent) => {
    evenement.preventDefault();
    setErreurServeur(null);
    const trouvees = valider();
    setErreurs(trouvees);
    const premiere = Object.keys(trouvees)[0];
    if (premiere) {
      document.getElementById(`champ-${premiere}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const corps: CommandeEntree = {
      mode,
      lignes: lignes.map((l) => ({ produitId: l.produitId, selection: l.selection, quantite: l.quantite })),
      client: { prenom: client.prenom.trim(), nom: client.nom.trim(), telephone: client.telephone.trim(), email: client.email.trim() },
      adresse:
        mode === "livraison" && adresse
          ? {
              libelle: adresse.libelle,
              numero: adresse.numero,
              rue: adresse.rue,
              codePostal: adresse.codePostal,
              ville: adresse.ville,
              insee: adresse.insee,
              latitude: adresse.latitude,
              longitude: adresse.longitude,
              complement: complement.trim(),
              instructions: instructions.trim(),
            }
          : null,
      creneau: quand === "plus-tard" ? creneau : null,
      note: note.trim(),
      paiement,
      cgv: true,
    };

    setEnvoi(true);
    try {
      const reponse = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const json = await reponse.json();
      if (!reponse.ok) {
        setErreurServeur(json.erreur ?? "La commande n'a pas pu être enregistrée.");
        if (json.champ) setErreurs({ [String(json.champ).split(".")[0]]: json.erreur });
        return;
      }
      memoriserCommande(json.jeton);
      if (json.paiement.type === "sur_place") {
        vider();
        router.push(`/suivi/${json.jeton}`);
        return;
      }
      setEtape({ jeton: json.jeton, numero: json.numero, total: json.total, paiement: json.paiement });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErreurServeur("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setEnvoi(false);
    }
  };

  if (hydrate && lignes.length === 0 && !etape) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="titre-display text-5xl">Panier vide</h1>
        <p className="mt-3 text-gris">Compose ton tacos ou choisis un burger : ta commande t&apos;attend ici.</p>
        <Link href="/carte" className={classesBouton("primaire", "lg", "mt-8")}>
          Voir la carte
        </Link>
      </div>
    );
  }

  const fermeSansCreneau = dispo && !dispo.desQuePossible && dispo.creneaux.length === 0;
  const bloque = Boolean(dispo?.enPause || fermeSansCreneau);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:pb-16">
      <Link href="/carte" className="inline-flex items-center gap-1.5 text-sm font-bold text-gris hover:text-encre">
        <ArrowLeft className="size-4" aria-hidden /> Continuer mes achats
      </Link>
      <h1 className="titre-display mt-3 text-5xl sm:text-6xl">Ta commande</h1>

      <AnimatePresence>
        {dispo?.enPause && (
          <Banniere ton="attente" Icone={PauseCircle}>
            {dispo.messagePause}
          </Banniere>
        )}
        {fermeSansCreneau && !dispo?.enPause && (
          <Banniere ton="ferme" Icone={Clock}>
            Le restaurant est fermé pour le moment
            {dispo?.ouvreA ? ` : réouverture ${jourParis(new Date(dispo.ouvreA))} à ${heureParis(new Date(dispo.ouvreA))}.` : "."}
          </Banniere>
        )}
      </AnimatePresence>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_390px] lg:items-start">
        <div className="min-w-0">
          {etape ? (
            <EtapePaiement
              paiement={etape.paiement}
              jeton={etape.jeton}
              numero={etape.numero}
              total={etape.total}
              cleStripe={cleStripe}
              onRetour={() => setEtape(null)}
              onPaye={() => vider()}
            />
          ) : (
            <form ref={formulaire} id="form-commande" onSubmit={envoyer} noValidate className="space-y-4">
              <Bloc numero={1} titre="Livraison ou à emporter ?">
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Mode de commande">
                  {(
                    [
                      { id: "livraison", titre: "Livraison", detail: "Chez toi, bien chaud", Icone: Bike },
                      { id: "emporter", titre: "À emporter", detail: "Prêt au comptoir", Icone: Store },
                    ] as const
                  )
                    .filter((m) => reglages.modes[m.id])
                    .map(({ id, titre, detail, Icone }) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={mode === id}
                        onClick={() => choisirMode(id)}
                        className={clsx(
                          "relative flex flex-col items-start rounded-2xl p-4 text-left transition",
                          mode === id ? "bg-nuit-900 text-creme shadow-flottant" : "bg-white ring-1 ring-ligne hover:ring-braise-300",
                        )}
                      >
                        <Icone className={clsx("size-7", mode === id ? "text-ambre-400" : "text-braise-500")} aria-hidden />
                        <span className="mt-3 text-lg font-extrabold">{titre}</span>
                        <span className={clsx("text-sm", mode === id ? "text-creme/70" : "text-gris")}>{detail}</span>
                      </button>
                    ))}
                </div>
              </Bloc>

              {mode === "livraison" ? (
                <Bloc numero={2} titre="Adresse de livraison" id="champ-adresse" erreur={erreurs.adresse}>
                  <ChampAdresse adresse={adresse} onChoisir={choisirAdresse} invalide={Boolean(erreurs.adresse)} />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Champ libelle="Complément" facultatif>
                      <input className="champ" value={complement} onChange={(e) => setComplement(e.target.value)} maxLength={120} placeholder="Bât., étage, digicode" autoComplete="address-line2" />
                    </Champ>
                    <Champ libelle="Pour le livreur" facultatif>
                      <input className="champ" value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={200} placeholder="Sonner chez…, porte bleue…" />
                    </Champ>
                  </div>
                </Bloc>
              ) : (
                <Bloc numero={2} titre="Retrait au restaurant">
                  <div className="flex items-start gap-3 rounded-2xl bg-sable p-4">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-braise-600" aria-hidden />
                    <div>
                      <p className="font-bold">{reglages.restaurant.nom}</p>
                      <p className="text-sm text-gris">
                        {reglages.restaurant.adresse}, {reglages.restaurant.codePostal} {reglages.restaurant.ville}
                      </p>
                    </div>
                  </div>
                </Bloc>
              )}

              <Bloc numero={3} titre="Pour quand ?" id="champ-creneau" erreur={erreurs.creneau}>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Moment de la commande">
                  <ChoixQuand
                    actif={quand === "asap"}
                    desactive={dispo ? !dispo.desQuePossible : false}
                    onClick={() => setQuand("asap")}
                    Icone={Zap}
                    titre="Dès que possible"
                    detail={dispo ? (dispo.desQuePossible ? `≈ ${dispo.delaiMinutes} min` : "Indisponible") : "…"}
                  />
                  <ChoixQuand
                    actif={quand === "plus-tard"}
                    desactive={dispo ? dispo.creneaux.length === 0 : false}
                    onClick={() => setQuand("plus-tard")}
                    Icone={CalendarClock}
                    titre="Programmer"
                    detail="Choisis l'heure"
                  />
                </div>
                <AnimatePresence initial={false}>
                  {quand === "plus-tard" && dispo && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <ListeCreneaux creneaux={dispo.creneaux} choisi={creneau} onChoisir={setCreneau} maintenant={dispo.maintenant} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Bloc>

              <Bloc numero={4} titre="Tes coordonnées">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Champ libelle="Prénom" id="champ-prenom" erreur={erreurs.prenom}>
                    <input className="champ" value={client.prenom} onChange={(e) => setClient({ prenom: e.target.value })} autoComplete="given-name" maxLength={60} aria-invalid={Boolean(erreurs.prenom) || undefined} />
                  </Champ>
                  <Champ libelle="Nom" facultatif>
                    <input className="champ" value={client.nom} onChange={(e) => setClient({ nom: e.target.value })} autoComplete="family-name" maxLength={60} />
                  </Champ>
                  <Champ libelle="Téléphone" id="champ-telephone" erreur={erreurs.telephone}>
                    <input className="champ" type="tel" inputMode="tel" value={client.telephone} onChange={(e) => setClient({ telephone: e.target.value })} autoComplete="tel" placeholder="06 12 34 56 78" aria-invalid={Boolean(erreurs.telephone) || undefined} />
                  </Champ>
                  <Champ libelle="E-mail" facultatif aide="Pour recevoir ta confirmation" id="champ-email" erreur={erreurs.email}>
                    <input className="champ" type="email" inputMode="email" value={client.email} onChange={(e) => setClient({ email: e.target.value })} autoComplete="email" maxLength={120} aria-invalid={Boolean(erreurs.email) || undefined} />
                  </Champ>
                </div>
                <Champ libelle="Un mot pour la cuisine ?" facultatif className="mt-3">
                  <textarea className="champ min-h-20 resize-y" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Sans oignons, bien grillé, couverts…" />
                </Champ>
              </Bloc>

              <Bloc numero={5} titre="Paiement" id="champ-cgv" erreur={erreurs.cgv}>
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Moyen de paiement">
                  {enLignePossible && (
                    <ChoixPaiement actif={paiement === "en_ligne"} onClick={() => setPaiement("en_ligne")} Icone={CreditCard} titre="Payer en ligne" detail="Carte, Apple Pay, Google Pay" />
                  )}
                  {reglages.paiement.surPlace && (
                    <ChoixPaiement
                      actif={paiement === "sur_place"}
                      onClick={() => setPaiement("sur_place")}
                      Icone={Banknote}
                      titre={mode === "livraison" ? "Payer au livreur" : "Payer au comptoir"}
                      detail="Espèces ou carte bancaire"
                    />
                  )}
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl p-1 text-sm">
                  <input type="checkbox" checked={cgv} onChange={(e) => setCgv(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-braise-500" aria-invalid={Boolean(erreurs.cgv) || undefined} />
                  <span>
                    J&apos;accepte les{" "}
                    <Link href="/cgv" target="_blank" className="font-bold text-braise-700 underline underline-offset-2">
                      conditions générales de vente
                    </Link>{" "}
                    et la{" "}
                    <Link href="/confidentialite" target="_blank" className="font-bold text-braise-700 underline underline-offset-2">
                      politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>
              </Bloc>
            </form>
          )}
        </div>

        <aside className="lg:sticky lg:top-28" aria-label="Récapitulatif">
          <div className="rounded-[1.75rem] bg-white p-5 shadow-carte ring-1 ring-ligne sm:p-6" id="champ-lignes">
            <h2 className="text-lg font-extrabold">Récapitulatif</h2>
            <ul className="mt-4 space-y-3">
              {lignes.map((l) => (
                <li key={l.cle} className="flex gap-3">
                  {l.image && (
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-sable">
                      <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <p className="font-bold">
                        {l.quantite} × {l.nom}
                        {l.varianteNom && <span className="font-semibold text-gris"> · {l.varianteNom}</span>}
                      </p>
                      <span className="font-bold tabular-nums">{euros(l.prixUnitaire * l.quantite)}</span>
                    </div>
                    {l.details && <p className="line-clamp-2 text-xs text-gris">{l.details}</p>}
                    {problemes.has(l.cle) && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-bold text-alerte">
                        <CircleAlert className="size-3.5" aria-hidden /> {problemes.get(l.cle)}
                      </p>
                    )}
                    {!etape && (
                      <Compteur valeur={l.quantite} onChange={(q) => changerQuantite(l.cle, q)} taille="sm" corbeille libelle={`Quantité de ${l.nom}`} className="mt-1.5" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {erreurs.lignes && <p className="mt-3 text-sm font-semibold text-alerte">{erreurs.lignes}</p>}
            <dl className="mt-5 space-y-1.5 border-t border-ligne pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gris">Sous-total</dt>
                <dd className="tabular-nums">{euros(sousTotal)}</dd>
              </div>
              {mode === "livraison" && (
                <div className="flex justify-between">
                  <dt className="text-gris">Livraison</dt>
                  <dd className="tabular-nums">{zone ? (frais === 0 ? "Offerte" : euros(frais)) : "—"}</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 text-lg font-extrabold">
                <dt>Total</dt>
                <dd className="tabular-nums">{euros(total)}</dd>
              </div>
            </dl>
            <AnimatePresence>
              {erreurServeur && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-alerte"
                  role="alert"
                >
                  {erreurServeur}
                </motion.p>
              )}
            </AnimatePresence>
            {!etape && (
              <div className="mt-5 hidden lg:block">
                <Bouton type="submit" form="form-commande" taille="lg" className="w-full" chargement={envoi} disabled={bloque} icone={paiement === "en_ligne" ? <Lock className="size-5" aria-hidden /> : undefined}>
                  {paiement === "en_ligne" ? `Payer ${euros(total)}` : `Commander · ${euros(total)}`}
                </Bouton>
              </div>
            )}
          </div>
        </aside>
      </div>

      {!etape && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ligne bg-papier/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <Bouton type="submit" form="form-commande" taille="lg" className="w-full" chargement={envoi} disabled={bloque} icone={paiement === "en_ligne" ? <Lock className="size-5" aria-hidden /> : undefined}>
            {paiement === "en_ligne" ? `Payer ${euros(total)}` : `Commander · ${euros(total)}`}
          </Bouton>
        </div>
      )}
    </div>
  );
}

function Banniere({ ton, Icone, children }: { ton: "attente" | "ferme"; Icone: typeof Clock; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={clsx("mt-5 flex items-start gap-3 rounded-2xl p-4 font-semibold", ton === "attente" ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-nuit-900 text-creme")}
      role="status"
    >
      <Icone className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p>{children}</p>
    </motion.div>
  );
}

function Bloc({ numero, titre, children, id, erreur }: { numero: number; titre: string; children: React.ReactNode; id?: string; erreur?: string }) {
  return (
    <section id={id} className={clsx("scroll-mt-32 rounded-[1.75rem] bg-white p-5 shadow-carte ring-1 transition sm:p-6", erreur ? "ring-2 ring-alerte/60" : "ring-ligne")} aria-labelledby={`titre-bloc-${numero}`}>
      <h2 id={`titre-bloc-${numero}`} className="mb-4 flex items-center gap-3 text-lg font-extrabold">
        <span className="grid size-7 place-items-center rounded-full bg-nuit-900 text-sm text-ambre-400">{numero}</span>
        {titre}
      </h2>
      {children}
      {erreur && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-alerte" role="alert">
          <CircleAlert className="size-4" aria-hidden /> {erreur}
        </p>
      )}
    </section>
  );
}

function Champ({ libelle, children, facultatif, aide, erreur, id, className }: { libelle: string; children: React.ReactNode; facultatif?: boolean; aide?: string; erreur?: string; id?: string; className?: string }) {
  return (
    <label id={id} className={clsx("block scroll-mt-32", className)}>
      <span className="mb-1.5 flex items-baseline gap-2 text-sm font-bold">
        {libelle}
        {facultatif && <span className="text-xs font-semibold text-gris">facultatif</span>}
      </span>
      {children}
      {aide && !erreur && <span className="mt-1 block text-xs text-gris">{aide}</span>}
      {erreur && <span className="mt-1 block text-xs font-semibold text-alerte">{erreur}</span>}
    </label>
  );
}

function ChoixQuand({ actif, desactive, onClick, Icone, titre, detail }: { actif: boolean; desactive: boolean; onClick: () => void; Icone: typeof Clock; titre: string; detail: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={actif}
      disabled={desactive}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 rounded-2xl p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45",
        actif ? "bg-braise-50 ring-2 ring-braise-500" : "bg-white ring-1 ring-ligne hover:ring-braise-300",
      )}
    >
      <Icone className="size-6 shrink-0 text-braise-500" aria-hidden />
      <span>
        <span className="block font-extrabold leading-tight">{titre}</span>
        <span className="text-sm text-gris">{detail}</span>
      </span>
    </button>
  );
}

function ChoixPaiement({ actif, onClick, Icone, titre, detail }: { actif: boolean; onClick: () => void; Icone: typeof Clock; titre: string; detail: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={actif}
      onClick={onClick}
      className={clsx("flex items-center gap-3 rounded-2xl p-4 text-left transition", actif ? "bg-braise-50 ring-2 ring-braise-500" : "bg-white ring-1 ring-ligne hover:ring-braise-300")}
    >
      <span className={clsx("grid size-10 shrink-0 place-items-center rounded-full", actif ? "bg-braise-500 text-white" : "bg-sable text-braise-600")}>
        <Icone className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block font-extrabold leading-tight">{titre}</span>
        <span className="text-sm text-gris">{detail}</span>
      </span>
    </button>
  );
}

function ListeCreneaux({ creneaux, choisi, onChoisir, maintenant }: { creneaux: Creneau[]; choisi: string | null; onChoisir: (iso: string) => void; maintenant: string }) {
  const parJour = new Map<string, Creneau[]>();
  for (const c of creneaux) parJour.set(c.jour, [...(parJour.get(c.jour) ?? []), c]);
  const aujourdHui = partiesParis(new Date(maintenant)).date;
  if (creneaux.length === 0) return <p className="mt-4 text-sm text-gris">Aucun créneau disponible pour le moment.</p>;
  return (
    <div className="mt-4 space-y-4">
      {[...parJour.entries()].map(([jour, liste]) => (
        <div key={jour}>
          <p className="mb-2 text-sm font-bold capitalize">{jour === aujourdHui ? "Aujourd'hui" : jourParis(new Date(liste[0].iso))}</p>
          <div className="barre-defilement-fine -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {liste.map((c) => (
              <button
                key={c.iso}
                type="button"
                onClick={() => onChoisir(c.iso)}
                aria-pressed={choisi === c.iso}
                className={clsx(
                  "h-11 shrink-0 rounded-full px-4 text-sm font-bold tabular-nums transition",
                  choisi === c.iso ? "bg-nuit-900 text-creme" : "bg-sable text-encre hover:bg-braise-100",
                )}
              >
                {c.libelle}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
