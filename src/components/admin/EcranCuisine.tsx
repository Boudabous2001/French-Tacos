"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import {
  BellRing,
  Bike,
  CalendarClock,
  Check,
  ChefHat,
  CircleAlert,
  Navigation,
  Package,
  Phone,
  Printer,
  Store,
  Timer,
  Volume2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { mettreAJourStatut } from "@/app/admin/actions";
import { Feuille } from "@/components/ui/Feuille";
import { euros } from "@/lib/argent";
import { telephoneLisible, type Statut } from "@/lib/commande-schema";
import { heureParis, jourParis, partiesParis } from "@/lib/horaires";
import type { CommandeCuisine, TableauCuisine } from "@/lib/serveur/commandes";

/* ---------------- Sonnerie (synthétisée, aucun fichier audio) ---------------- */

class Sonnette {
  private contexte: AudioContext | null = null;

  async activer() {
    this.contexte ??= new AudioContext();
    await this.contexte.resume();
  }

  jouer() {
    const ctx = this.contexte;
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    [
      [988, 0],
      [1319, 0.16],
      [1760, 0.32],
      [1319, 0.7],
      [1760, 0.86],
    ].forEach(([frequence, decalage]) => {
      const oscillateur = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillateur.type = "triangle";
      oscillateur.frequency.value = frequence;
      gain.gain.setValueAtTime(0.0001, t + decalage);
      gain.gain.exponentialRampToValueAtTime(0.5, t + decalage + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decalage + 0.45);
      oscillateur.connect(gain).connect(ctx.destination);
      oscillateur.start(t + decalage);
      oscillateur.stop(t + decalage + 0.5);
    });
  }
}

/* ---------------- Écran ---------------- */

const COLONNES: { id: string; titre: string; statuts: Statut[]; Icone: typeof ChefHat }[] = [
  { id: "a-accepter", titre: "À accepter", statuts: ["nouvelle"], Icone: BellRing },
  { id: "en-cuisine", titre: "En cuisine", statuts: ["acceptee"], Icone: ChefHat },
  { id: "pretes", titre: "Prêtes · en route", statuts: ["prete", "en_livraison"], Icone: Package },
  { id: "terminees", titre: "Terminées", statuts: ["terminee", "annulee"], Icone: Check },
];

export function EcranCuisine({ initial, preparationDefaut }: { initial: TableauCuisine; preparationDefaut: number }) {
  const [tableau, setTableau] = useState(initial);
  const [enDirect, setEnDirect] = useState(false);
  const [sonActif, setSonActif] = useState(false);
  const [arrivees, setArrivees] = useState<Set<string>>(() => new Set());
  const [ongletMobile, setOngletMobile] = useState(COLONNES[0].id);
  const [aRefuser, setARefuser] = useState<CommandeCuisine | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const sonnette = useRef(new Sonnette());
  const router = useRouter();

  const recharger = useCallback(async () => {
    try {
      const reponse = await fetch("/api/admin/commandes", { cache: "no-store" });
      if (reponse.status === 401) {
        router.replace("/admin/connexion");
        return;
      }
      if (reponse.ok) setTableau((await reponse.json()) as TableauCuisine);
    } catch {
      /* réseau coupé : le flux se reconnecte seul */
    }
  }, [router]);

  // Flux temps réel + filet de sécurité toutes les 30 s.
  useEffect(() => {
    const source = new EventSource("/api/admin/flux");
    source.onopen = () => setEnDirect(true);
    source.onerror = () => setEnDirect(false);
    source.addEventListener("commande", (e) => {
      const evenement = JSON.parse((e as MessageEvent).data) as { id: string; numero: number; arrivee: boolean };
      if (evenement.arrivee) {
        setArrivees((s) => new Set(s).add(evenement.id));
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Nouvelle commande n° ${evenement.numero}`, { body: "À accepter sur l'écran cuisine", tag: evenement.id });
        }
      }
      void recharger();
    });
    const minuteur = window.setInterval(recharger, 30_000);
    const horloge = window.setInterval(() => setMaintenant(Date.now()), 20_000);
    return () => {
      source.close();
      window.clearInterval(minuteur);
      window.clearInterval(horloge);
    };
  }, [recharger]);

  const parColonne = useMemo(() => {
    const groupes = new Map<string, CommandeCuisine[]>();
    for (const colonne of COLONNES) {
      const liste = tableau.commandes.filter((c) => colonne.statuts.includes(c.statut));
      liste.sort((a, b) =>
        colonne.id === "terminees" ? b.creeLe.localeCompare(a.creeLe) : (a.pretePrevueA ?? a.creneau ?? a.creeLe).localeCompare(b.pretePrevueA ?? b.creneau ?? b.creeLe),
      );
      groupes.set(colonne.id, colonne.id === "terminees" ? liste.slice(0, 30) : liste);
    }
    return groupes;
  }, [tableau]);

  const aAccepter = parColonne.get("a-accepter")?.length ?? 0;

  // Sonne tant qu'une commande attend d'être acceptée.
  useEffect(() => {
    if (!sonActif || aAccepter === 0) return;
    sonnette.current.jouer();
    const repetition = window.setInterval(() => sonnette.current.jouer(), 6000);
    return () => window.clearInterval(repetition);
  }, [sonActif, aAccepter]);

  useEffect(() => {
    document.title = aAccepter > 0 ? `(${aAccepter}) Nouvelle commande ! · French Tacos` : "Commandes · Back-office French Tacos";
  }, [aAccepter]);

  const activerSon = async () => {
    await sonnette.current.activer();
    setSonActif(true);
    sonnette.current.jouer();
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
    // Garde l'écran de la tablette allumé pendant le service.
    try {
      await (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<unknown> } }).wakeLock?.request("screen");
    } catch {
      /* non pris en charge */
    }
  };

  const action = async (commande: CommandeCuisine, statut: Statut, options?: { preparationMinutes?: number; motif?: string }) => {
    const resultat = await mettreAJourStatut(commande.id, statut, options);
    if (!resultat?.ok) setMessage(resultat?.message ?? "Action impossible.");
    setArrivees((s) => {
      const copie = new Set(s);
      copie.delete(commande.id);
      return copie;
    });
    await recharger();
  };

  const { statistiques } = tableau;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Statistique libelle="Commandes du jour" valeur={String(statistiques.commandes)} />
        <Statistique libelle="Chiffre du jour" valeur={euros(statistiques.chiffreAffaires)} />
        <Statistique libelle="Panier moyen" valeur={euros(statistiques.panierMoyen)} />
        <Statistique libelle="En cours" valeur={String(statistiques.enCours)} />
        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-creme/70">
            <span className={clsx("size-2.5 rounded-full", enDirect ? "animate-pulsation bg-emerald-400 text-emerald-400" : "bg-amber-400")} aria-hidden />
            {enDirect ? "En direct" : "Reconnexion…"}
          </span>
          {!sonActif && (
            <button
              type="button"
              onClick={activerSon}
              className="flex h-11 animate-pulse items-center gap-2 rounded-full bg-amber-400 px-5 text-sm font-extrabold text-nuit-900 hover:animate-none"
            >
              <Volume2 className="size-5" aria-hidden /> Activer la sonnerie
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-3 rounded-2xl bg-red-500/15 p-3 text-sm font-semibold text-red-300 ring-1 ring-red-400/30"
            role="alert"
          >
            <CircleAlert className="size-5 shrink-0" aria-hidden />
            {message}
            <button type="button" onClick={() => setMessage(null)} className="ml-auto rounded-full p-1 hover:bg-white/10" aria-label="Fermer">
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-full bg-nuit-900 p-1 xl:hidden" role="tablist">
        {COLONNES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={ongletMobile === c.id}
            onClick={() => setOngletMobile(c.id)}
            className={clsx("flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold", ongletMobile === c.id ? "bg-ambre-400 text-nuit-900" : "text-creme/70")}
          >
            {c.titre}
            <span className={clsx("rounded-full px-1.5 text-xs", ongletMobile === c.id ? "bg-nuit-900/15" : "bg-white/10", c.id === "a-accepter" && aAccepter > 0 && "bg-braise-500 text-white")}>
              {parColonne.get(c.id)?.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-4">
        {COLONNES.map((colonne) => {
          const commandes = parColonne.get(colonne.id) ?? [];
          return (
            <section key={colonne.id} className={clsx("min-w-0", ongletMobile !== colonne.id && "hidden xl:block")} aria-labelledby={`colonne-${colonne.id}`}>
              <h2 id={`colonne-${colonne.id}`} className="mb-3 hidden items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-creme/60 xl:flex">
                <colonne.Icone className="size-4" aria-hidden />
                {colonne.titre}
                <span className={clsx("rounded-full px-2 py-0.5 text-xs", colonne.id === "a-accepter" && commandes.length > 0 ? "bg-braise-500 text-white" : "bg-white/10")}>
                  {commandes.length}
                </span>
              </h2>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {commandes.map((commande) => (
                    <CarteCommande
                      key={commande.id}
                      commande={commande}
                      maintenant={maintenant}
                      nouvelle={arrivees.has(commande.id)}
                      preparationDefaut={preparationDefaut}
                      onAction={(statut, options) => action(commande, statut, options)}
                      onRefuser={() => setARefuser(commande)}
                    />
                  ))}
                </AnimatePresence>
                {commandes.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-creme/40">
                    {colonne.id === "a-accepter" ? "Aucune commande en attente. Le téléphone va sonner 🔔" : "Rien ici pour l'instant."}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <FenetreRefus
        commande={aRefuser}
        onFermer={() => setARefuser(null)}
        onConfirmer={async (motif) => {
          if (!aRefuser) return;
          const commande = aRefuser;
          setARefuser(null);
          await action(commande, "annulee", { motif });
        }}
      />
    </div>
  );
}

function Statistique({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="rounded-2xl bg-nuit-900 px-4 py-2.5 ring-1 ring-white/5">
      <p className="text-[0.7rem] font-bold uppercase tracking-wider text-creme/50">{libelle}</p>
      <p className="text-lg font-extrabold tabular-nums text-white">{valeur}</p>
    </div>
  );
}

function depuis(iso: string, maintenant: number) {
  const minutes = Math.max(0, Math.round((maintenant - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  return `à ${heureParis(new Date(iso))}`;
}

function quand(iso: string) {
  const instant = new Date(iso);
  const memeJour = partiesParis(instant).date === partiesParis(new Date()).date;
  return memeJour ? heureParis(instant) : `${jourParis(instant)} ${heureParis(instant)}`;
}

const PREPARATIONS = [10, 15, 20, 30, 45];

function CarteCommande({
  commande: c,
  maintenant,
  nouvelle,
  preparationDefaut,
  onAction,
  onRefuser,
}: {
  commande: CommandeCuisine;
  maintenant: number;
  nouvelle: boolean;
  preparationDefaut: number;
  onAction: (statut: Statut, options?: { preparationMinutes?: number; motif?: string }) => Promise<void>;
  onRefuser: () => void;
}) {
  const [enCours, demarrer] = useTransition();
  const [preparation, setPreparation] = useState(PREPARATIONS.includes(preparationDefaut) ? preparationDefaut : 20);
  const livraison = c.mode === "livraison";
  const lancer = (statut: Statut, options?: { preparationMinutes?: number }) => demarrer(() => onAction(statut, options));

  const reste = c.pretePrevueA ? Math.round((new Date(c.pretePrevueA).getTime() - maintenant) / 60_000) : null;
  const termine = c.statut === "terminee" || c.statut === "annulee";
  const adresseCarte = c.adresse ? encodeURIComponent(c.adresse.libelle) : "";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={clsx(
        "rounded-[1.4rem] bg-nuit-800 p-4 ring-1 transition",
        nouvelle || c.statut === "nouvelle" ? "ring-2 ring-braise-500 shadow-[0_0_40px_-12px_rgb(251_106_11/0.8)]" : "ring-white/5",
        termine && "opacity-60",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="titre-display text-3xl leading-none text-white">#{c.numero}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", livraison ? "bg-sky-500/15 text-sky-300" : "bg-violet-500/15 text-violet-300")}>
              {livraison ? <Bike className="size-3.5" aria-hidden /> : <Store className="size-3.5" aria-hidden />}
              {livraison ? "Livraison" : "À emporter"}
            </span>
            {c.creneau ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                <CalendarClock className="size-3.5" aria-hidden /> Pour {quand(c.creneau)}
              </span>
            ) : (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-creme/80">Dès que possible</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold tabular-nums text-white">{euros(c.total)}</p>
          <BadgePaiement commande={c} />
          <p className="mt-1 text-xs text-creme/50">{depuis(c.creeLe, maintenant)}</p>
        </div>
      </header>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-nuit-900/70 px-3 py-2 text-sm">
        <span className="font-bold">
          {c.clientPrenom} {c.clientNom}
        </span>
        <a href={`tel:${c.clientTelephone}`} className="flex items-center gap-1.5 font-semibold text-ambre-300 hover:text-ambre-400">
          <Phone className="size-3.5" aria-hidden />
          {telephoneLisible(c.clientTelephone)}
        </a>
      </div>

      {c.adresse && (
        <div className="mt-2 rounded-xl bg-nuit-900/70 px-3 py-2 text-sm">
          <p className="font-semibold">{c.adresse.libelle}</p>
          {c.adresse.complement && <p className="text-creme/70">{c.adresse.complement}</p>}
          {c.adresse.instructions && <p className="italic text-creme/70">« {c.adresse.instructions} »</p>}
          <div className="mt-1.5 flex gap-3 text-xs font-bold">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${adresseCarte}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-300 hover:underline">
              <Navigation className="size-3.5" aria-hidden /> Google Maps
            </a>
            <a href={`https://waze.com/ul?q=${adresseCarte}&navigate=yes`} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">
              Waze
            </a>
          </div>
        </div>
      )}

      {c.note && <p className="mt-2 rounded-xl bg-amber-300 px-3 py-2 text-sm font-bold text-nuit-900">📝 {c.note}</p>}

      <ul className="mt-3 space-y-2">
        {c.lignes.map((l) => (
          <li key={l.id} className="text-[0.95rem]">
            <p className="font-extrabold text-white">
              <span className="mr-1.5 inline-grid min-w-7 place-items-center rounded-md bg-braise-500 px-1 text-sm">{l.quantite}×</span>
              {l.nom}
              {l.varianteNom && <span className="font-bold text-ambre-300"> · {l.varianteNom}</span>}
            </p>
            {l.resume.map((g) => (
              <p key={g.groupe} className="ml-9 text-sm leading-snug text-creme/75">
                <span className="text-creme/45">{g.titre} :</span> {g.choix.map((x) => (x.quantite > 1 ? `${x.nom} ×${x.quantite}` : x.nom)).join(", ")}
              </p>
            ))}
          </li>
        ))}
      </ul>

      {c.statut === "annulee" && c.motifAnnulation && <p className="mt-3 text-sm font-semibold text-red-300">Annulée : {c.motifAnnulation}</p>}

      {c.statut === "acceptee" && reste !== null && (
        <p className={clsx("mt-3 flex items-center gap-1.5 text-sm font-bold", reste < 0 ? "text-red-300" : "text-emerald-300")}>
          <Timer className="size-4" aria-hidden />
          {reste < 0 ? `En retard de ${-reste} min` : `Prête dans ${reste} min (${quand(c.pretePrevueA!)})`}
        </p>
      )}

      {!termine && (
        <footer className="mt-4 space-y-2">
          {c.statut === "nouvelle" && (
            <>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Temps de préparation">
                {PREPARATIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={preparation === m}
                    onClick={() => setPreparation(m)}
                    className={clsx("h-9 rounded-full px-3 text-sm font-bold tabular-nums", preparation === m ? "bg-white text-nuit-900" : "bg-white/10 text-creme hover:bg-white/15")}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <BoutonAction onClick={() => lancer("acceptee", { preparationMinutes: preparation })} enCours={enCours} principal>
                  Accepter
                </BoutonAction>
                <BoutonAction onClick={onRefuser} enCours={enCours}>
                  Refuser
                </BoutonAction>
              </div>
            </>
          )}
          {c.statut === "acceptee" && (
            <div className="flex gap-2">
              <BoutonAction onClick={() => lancer(livraison ? "en_livraison" : "prete")} enCours={enCours} principal>
                {livraison ? "Partie en livraison" : "Commande prête"}
              </BoutonAction>
              {livraison && (
                <BoutonAction onClick={() => lancer("prete")} enCours={enCours}>
                  Prête
                </BoutonAction>
              )}
            </div>
          )}
          {c.statut === "prete" && (
            <BoutonAction onClick={() => lancer(livraison ? "en_livraison" : "terminee")} enCours={enCours} principal>
              {livraison ? "Partie en livraison" : "Remise au client"}
            </BoutonAction>
          )}
          {c.statut === "en_livraison" && (
            <BoutonAction onClick={() => lancer("terminee")} enCours={enCours} principal>
              Livrée
            </BoutonAction>
          )}
          <div className="flex items-center justify-between pt-1">
            <a href={`/admin/ticket/${c.id}`} target="_blank" className="flex items-center gap-1.5 text-xs font-bold text-creme/60 hover:text-white">
              <Printer className="size-3.5" aria-hidden /> Ticket
            </a>
            {c.statut !== "nouvelle" && (
              <button type="button" onClick={onRefuser} className="text-xs font-bold text-creme/40 hover:text-red-300">
                Annuler la commande
              </button>
            )}
          </div>
        </footer>
      )}
    </motion.article>
  );
}

function BadgePaiement({ commande: c }: { commande: CommandeCuisine }) {
  const [texte, classe] =
    c.paiementStatut === "paye"
      ? [c.paiementMode === "en_ligne" ? "Payé en ligne" : "Encaissé", "text-emerald-300"]
      : c.paiementStatut === "rembourse"
        ? ["Remboursé", "text-sky-300"]
        : c.paiementStatut === "a_encaisser"
          ? ["À encaisser", "text-amber-300"]
          : ["Non payé", "text-red-300"];
  return <p className={clsx("text-xs font-extrabold", classe)}>{texte}</p>;
}

function BoutonAction({ children, onClick, enCours, principal }: { children: React.ReactNode; onClick: () => void; enCours: boolean; principal?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={enCours}
      className={clsx(
        "h-12 flex-1 rounded-2xl px-4 text-[0.95rem] font-extrabold transition active:scale-[0.98] disabled:opacity-50",
        principal ? "bg-braise-500 text-white hover:bg-braise-600" : "bg-white/10 text-creme hover:bg-white/15",
      )}
    >
      {children}
    </button>
  );
}

const MOTIFS = ["Rupture de stock", "Trop de commandes en ce moment", "Adresse hors zone de livraison", "Fermeture exceptionnelle", "Client injoignable"];

function FenetreRefus({ commande, onFermer, onConfirmer }: { commande: CommandeCuisine | null; onFermer: () => void; onConfirmer: (motif: string) => Promise<void> }) {
  const [motif, setMotif] = useState(MOTIFS[0]);
  const [autre, setAutre] = useState("");
  const paye = commande?.paiementStatut === "paye";
  return (
    <Feuille ouvert={Boolean(commande)} onFermer={onFermer} titre="Annuler la commande">
      <div className="overflow-y-auto p-6 pt-8 text-encre">
        <h2 className="titre-display text-3xl" data-focus-initial tabIndex={-1}>
          Annuler la commande #{commande?.numero}
        </h2>
        <p className="mt-2 text-sm text-gris">
          Le client est prévenu par e-mail et sur sa page de suivi.
          {paye && " Le paiement en ligne sera remboursé automatiquement."}
        </p>
        <div className="mt-5 grid gap-2">
          {[...MOTIFS, "Autre"].map((m) => (
            <label key={m} className={clsx("flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1", motif === m ? "bg-braise-50 ring-braise-500" : "ring-ligne")}>
              <input type="radio" name="motif" checked={motif === m} onChange={() => setMotif(m)} className="size-4 accent-braise-500" />
              <span className="font-semibold">{m}</span>
            </label>
          ))}
        </div>
        {motif === "Autre" && <input className="champ mt-3" value={autre} onChange={(e) => setAutre(e.target.value)} maxLength={300} placeholder="Motif communiqué au client" />}
        <button
          type="button"
          onClick={() => onConfirmer(motif === "Autre" ? autre.trim() || "Annulée par le restaurant" : motif)}
          className="mt-6 h-14 w-full rounded-full bg-alerte font-extrabold text-white hover:bg-red-700"
        >
          Confirmer l&apos;annulation{paye ? " et rembourser" : ""}
        </button>
      </div>
    </Feuille>
  );
}
