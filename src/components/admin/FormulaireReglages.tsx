"use client";

import { clsx } from "clsx";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { enregistrerReglages } from "@/app/admin/actions";
import { JOURS } from "@/lib/horaires";
import type { CommuneDesservie, Zone } from "@/lib/livraison";
import type { Reglages } from "@/lib/reglages-type";

const versTexte = (centimes: number | null) => (centimes === null ? "" : (centimes / 100).toFixed(2).replace(".", ","));
const versCentimes = (texte: string) => Math.round(Number(texte.replace(",", ".")) * 100) || 0;

export function FormulaireReglages({ reglages: initiaux }: { reglages: Reglages }) {
  const [r, setR] = useState(initiaux);
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();
  const [reference, setReference] = useState(initiaux);
  const modifie = JSON.stringify(r) !== JSON.stringify(reference);

  const maj = <K extends keyof Reglages>(cle: K, valeur: Reglages[K]) => setR((x) => ({ ...x, [cle]: valeur }));

  const enregistrer = () =>
    demarrer(async () => {
      const resultat = await enregistrerReglages(r);
      if (resultat?.ok) setReference(r);
      setRetour({ ok: Boolean(resultat?.ok), texte: resultat?.message ?? "Erreur" });
    });

  const majZone = (index: number, zone: Partial<Zone>) => maj("zones", r.zones.map((z, i) => (i === index ? { ...z, ...zone } : z)));

  return (
    <div className="mx-auto max-w-4xl pb-28">
      <h1 className="titre-display text-4xl text-white">Réglages</h1>
      <p className="mt-1 text-sm text-creme/60">Les changements s&apos;appliquent au site dès l&apos;enregistrement.</p>

      <Section titre="Commandes en ligne">
        <Bascule libelle="Commandes en pause" detail="Coupe immédiatement les nouvelles commandes (coup de feu, rupture…)" actif={r.commandes.enPause} onChange={(v) => maj("commandes", { ...r.commandes, enPause: v })} />
        <Champ libelle="Message affiché pendant la pause">
          <textarea className={entree} rows={2} value={r.commandes.messagePause} onChange={(e) => maj("commandes", { ...r.commandes, messagePause: e.target.value })} maxLength={240} />
        </Champ>
        <div className="grid gap-4 sm:grid-cols-3">
          <Champ libelle="Préparation (minutes)">
            <input className={entree} type="number" min={5} max={180} value={r.commandes.preparationMinutes} onChange={(e) => maj("commandes", { ...r.commandes, preparationMinutes: Number(e.target.value) })} />
          </Champ>
          <Champ libelle="Créneaux toutes les">
            <select className={entree} value={r.commandes.pasCreneauMinutes} onChange={(e) => maj("commandes", { ...r.commandes, pasCreneauMinutes: Number(e.target.value) })}>
              {[10, 15, 20, 30].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </Champ>
          <Champ libelle="Commande à l'avance (jours)">
            <input className={entree} type="number" min={0} max={7} value={r.commandes.joursAvance} onChange={(e) => maj("commandes", { ...r.commandes, joursAvance: Number(e.target.value) })} />
          </Champ>
        </div>
        <Bascule libelle="Précommande hors horaires" detail="Le client peut commander pour plus tard quand le restaurant est fermé" actif={r.commandes.precommande} onChange={(v) => maj("commandes", { ...r.commandes, precommande: v })} />
        <Champ libelle="Minimum pour la vente à emporter (€)">
          <input className={clsx(entree, "sm:w-40")} inputMode="decimal" defaultValue={versTexte(r.commandes.minimumEmporter)} onBlur={(e) => maj("commandes", { ...r.commandes, minimumEmporter: versCentimes(e.target.value) })} />
        </Champ>
      </Section>

      <Section titre="Modes et paiement">
        <div className="grid gap-3 sm:grid-cols-2">
          <Bascule libelle="Livraison" actif={r.modes.livraison} onChange={(v) => maj("modes", { ...r.modes, livraison: v })} />
          <Bascule libelle="À emporter" actif={r.modes.emporter} onChange={(v) => maj("modes", { ...r.modes, emporter: v })} />
          <Bascule libelle="Paiement en ligne" detail="Carte, Apple Pay, Google Pay (Stripe)" actif={r.paiement.enLigne} onChange={(v) => maj("paiement", { ...r.paiement, enLigne: v })} />
          <Bascule libelle="Paiement sur place" detail="Au livreur ou au comptoir" actif={r.paiement.surPlace} onChange={(v) => maj("paiement", { ...r.paiement, surPlace: v })} />
        </div>
      </Section>

      <Section titre="Horaires d'ouverture">
        <p className="text-sm text-creme/60">Une fin avant le début signifie « après minuit » (ex. 18:00 → 01:00).</p>
        <div className="divide-y divide-white/5">
          {JOURS.map((jour) => (
            <div key={jour} className="flex flex-wrap items-center gap-2 py-3">
              <span className="w-24 font-bold capitalize">{jour}</span>
              {r.horaires[jour].length === 0 && <span className="text-sm text-creme/40">Fermé</span>}
              {r.horaires[jour].map((plage, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-nuit-950 p-1 pl-2 ring-1 ring-white/10">
                  <input type="time" aria-label={`${jour} début ${i + 1}`} className="bg-transparent text-sm tabular-nums outline-none" value={plage.debut} onChange={(e) => maj("horaires", { ...r.horaires, [jour]: r.horaires[jour].map((p, j) => (j === i ? { ...p, debut: e.target.value } : p)) })} />
                  <span className="text-creme/40">→</span>
                  <input type="time" aria-label={`${jour} fin ${i + 1}`} className="bg-transparent text-sm tabular-nums outline-none" value={plage.fin} onChange={(e) => maj("horaires", { ...r.horaires, [jour]: r.horaires[jour].map((p, j) => (j === i ? { ...p, fin: e.target.value } : p)) })} />
                  <button type="button" className="grid size-7 place-items-center rounded-full text-creme/50 hover:bg-white/10 hover:text-red-300" aria-label="Retirer ce service" onClick={() => maj("horaires", { ...r.horaires, [jour]: r.horaires[jour].filter((_, j) => j !== i) })}>
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              ))}
              {r.horaires[jour].length < 4 && (
                <button type="button" className="flex h-8 items-center gap-1 rounded-full px-3 text-xs font-bold text-ambre-300 hover:bg-white/5" onClick={() => maj("horaires", { ...r.horaires, [jour]: [...r.horaires[jour], { debut: "18:00", fin: "23:00" }] })}>
                  <Plus className="size-3.5" aria-hidden /> Service
                </button>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section titre="Fermetures exceptionnelles">
        {r.fermetures.map((f, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <Champ libelle="Du">
              <input type="date" className={entree} value={f.du} onChange={(e) => maj("fermetures", r.fermetures.map((x, j) => (j === i ? { ...x, du: e.target.value } : x)))} />
            </Champ>
            <Champ libelle="Au">
              <input type="date" className={entree} value={f.au} onChange={(e) => maj("fermetures", r.fermetures.map((x, j) => (j === i ? { ...x, au: e.target.value } : x)))} />
            </Champ>
            <Champ libelle="Motif" className="min-w-40 flex-1">
              <input className={entree} value={f.motif ?? ""} maxLength={120} onChange={(e) => maj("fermetures", r.fermetures.map((x, j) => (j === i ? { ...x, motif: e.target.value } : x)))} />
            </Champ>
            <BoutonRetirer onClick={() => maj("fermetures", r.fermetures.filter((_, j) => j !== i))} libelle="Retirer cette fermeture" />
          </div>
        ))}
        <BoutonAjouter
          onClick={() => {
            const aujourdhui = new Date().toISOString().slice(0, 10);
            maj("fermetures", [...r.fermetures, { du: aujourdhui, au: aujourdhui, motif: "" }]);
          }}
        >
          Ajouter une fermeture
        </BoutonAjouter>
      </Section>

      <Section titre="Zones de livraison">
        {r.zones.map((zone, index) => (
          <div key={zone.id} className="rounded-2xl bg-nuit-950 p-4 ring-1 ring-white/10">
            <div className="flex flex-wrap items-end gap-3">
              <Champ libelle="Nom" className="min-w-36 flex-1">
                <input className={entree} value={zone.nom} maxLength={60} onChange={(e) => majZone(index, { nom: e.target.value })} />
              </Champ>
              <Champ libelle="Frais (€)">
                <input className={clsx(entree, "w-24")} inputMode="decimal" defaultValue={versTexte(zone.frais)} onBlur={(e) => majZone(index, { frais: versCentimes(e.target.value) })} />
              </Champ>
              <Champ libelle="Minimum (€)">
                <input className={clsx(entree, "w-24")} inputMode="decimal" defaultValue={versTexte(zone.minimum)} onBlur={(e) => majZone(index, { minimum: versCentimes(e.target.value) })} />
              </Champ>
              <Champ libelle="Offerte dès (€)">
                <input className={clsx(entree, "w-24")} inputMode="decimal" placeholder="jamais" defaultValue={versTexte(zone.gratuiteDes)} onBlur={(e) => majZone(index, { gratuiteDes: e.target.value.trim() ? versCentimes(e.target.value) : null })} />
              </Champ>
              <Champ libelle="Trajet (min)">
                <input className={clsx(entree, "w-20")} type="number" min={0} max={120} value={zone.trajetMinutes} onChange={(e) => majZone(index, { trajetMinutes: Number(e.target.value) })} />
              </Champ>
              <Bascule libelle="Active" actif={zone.active} onChange={(v) => majZone(index, { active: v })} compact />
              <BoutonRetirer onClick={() => maj("zones", r.zones.filter((_, i) => i !== index))} libelle={`Supprimer ${zone.nom}`} />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-creme/50">Communes livrées</p>
            <div className="mt-2 space-y-2">
              {zone.communes.map((commune, i) => (
                <LigneCommune
                  key={i}
                  commune={commune}
                  onChange={(c) => majZone(index, { communes: zone.communes.map((x, j) => (j === i ? c : x)) })}
                  onRetirer={() => majZone(index, { communes: zone.communes.filter((_, j) => j !== i) })}
                />
              ))}
              <BoutonAjouter onClick={() => majZone(index, { communes: [...zone.communes, { nom: "", codePostal: "" }] })}>Ajouter une commune</BoutonAjouter>
            </div>
          </div>
        ))}
        <BoutonAjouter
          onClick={() =>
            maj("zones", [
              ...r.zones,
              { id: `zone-${Date.now().toString(36)}`, nom: `Zone ${r.zones.length + 1}`, communes: [{ nom: "", codePostal: "" }], frais: 300, minimum: 1500, gratuiteDes: null, trajetMinutes: 20, active: true },
            ])
          }
        >
          Ajouter une zone
        </BoutonAjouter>
      </Section>

      <Section titre="Restaurant et mentions légales">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["nom", "Nom commercial"],
              ["slogan", "Slogan"],
              ["adresse", "Adresse"],
              ["codePostal", "Code postal"],
              ["ville", "Ville"],
              ["telephone", "Téléphone"],
              ["email", "E-mail (reçoit les nouvelles commandes)"],
              ["raisonSociale", "Raison sociale"],
              ["siret", "SIRET"],
              ["tvaIntracom", "N° TVA intracommunautaire"],
              ["responsablePublication", "Responsable de la publication"],
            ] as const
          ).map(([cle, libelle]) => (
            <Champ key={cle} libelle={libelle}>
              <input className={entree} value={r.restaurant[cle]} onChange={(e) => maj("restaurant", { ...r.restaurant, [cle]: e.target.value })} />
            </Champ>
          ))}
          <Champ libelle="Latitude (optionnel)">
            <input className={entree} inputMode="decimal" value={r.restaurant.latitude ?? ""} onChange={(e) => maj("restaurant", { ...r.restaurant, latitude: e.target.value ? Number(e.target.value) : null })} />
          </Champ>
          <Champ libelle="Longitude (optionnel)">
            <input className={entree} inputMode="decimal" value={r.restaurant.longitude ?? ""} onChange={(e) => maj("restaurant", { ...r.restaurant, longitude: e.target.value ? Number(e.target.value) : null })} />
          </Champ>
        </div>
      </Section>

      <Section titre="Réseaux sociaux">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["instagram", "Instagram"],
              ["facebook", "Facebook"],
              ["tiktok", "TikTok"],
              ["snapchat", "Snapchat"],
              ["avisGoogle", "Lien des avis Google"],
            ] as const
          ).map(([cle, libelle]) => (
            <Champ key={cle} libelle={libelle}>
              <input className={entree} type="url" placeholder="https://…" value={r.reseaux[cle]} onChange={(e) => maj("reseaux", { ...r.reseaux, [cle]: e.target.value.trim() })} />
            </Champ>
          ))}
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-nuit-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <p className={clsx("flex-1 text-sm font-semibold", retour ? (retour.ok ? "text-emerald-300" : "text-red-300") : "text-creme/50")} role="status">
            {retour?.texte ?? (modifie ? "Modifications non enregistrées" : "Tout est à jour")}
          </p>
          <button
            type="button"
            onClick={enregistrer}
            disabled={enCours}
            className="flex h-12 items-center gap-2 rounded-full bg-braise-500 px-6 font-extrabold text-white transition hover:bg-braise-600 disabled:opacity-50"
          >
            <Save className="size-5" aria-hidden /> {enCours ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

const entree =
  "h-11 w-full rounded-xl bg-nuit-950 px-3 text-sm text-creme outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-ambre-400 [&:is(textarea)]:h-auto [&:is(textarea)]:py-2";

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 space-y-4 rounded-[1.5rem] bg-nuit-900 p-5 ring-1 ring-white/5 sm:p-6">
      <h2 className="text-lg font-extrabold text-white">{titre}</h2>
      {children}
    </section>
  );
}

function Champ({ libelle, children, className }: { libelle: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1 block text-xs font-bold text-creme/60">{libelle}</span>
      {children}
    </label>
  );
}

function Bascule({ libelle, detail, actif, onChange, compact }: { libelle: string; detail?: string; actif: boolean; onChange: (v: boolean) => void; compact?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={() => onChange(!actif)}
      className={clsx("flex items-center gap-3 rounded-2xl text-left", compact ? "h-11" : "w-full bg-nuit-950 p-3 ring-1 ring-white/10")}
    >
      <span className={clsx("relative h-7 w-12 shrink-0 rounded-full transition-colors", actif ? "bg-emerald-500" : "bg-white/15")}>
        <span className={clsx("absolute top-1 size-5 rounded-full bg-white shadow transition-transform", actif ? "translate-x-6" : "translate-x-1")} />
      </span>
      <span>
        <span className="block text-sm font-bold">{libelle}</span>
        {detail && <span className="block text-xs text-creme/50">{detail}</span>}
      </span>
    </button>
  );
}

function BoutonAjouter({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-ambre-300 ring-1 ring-ambre-400/30 hover:bg-ambre-400/10">
      <Plus className="size-4" aria-hidden /> {children}
    </button>
  );
}

function BoutonRetirer({ onClick, libelle }: { onClick: () => void; libelle: string }) {
  return (
    <button type="button" onClick={onClick} className="grid size-11 place-items-center rounded-xl text-creme/50 hover:bg-red-500/10 hover:text-red-300" aria-label={libelle} title={libelle}>
      <Trash2 className="size-4" />
    </button>
  );
}

function LigneCommune({ commune, onChange, onRetirer }: { commune: CommuneDesservie; onChange: (c: CommuneDesservie) => void; onRetirer: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input className={clsx(entree, "min-w-40 flex-1")} placeholder="Commune" aria-label="Commune" value={commune.nom} onChange={(e) => onChange({ ...commune, nom: e.target.value })} />
      <input className={clsx(entree, "w-28")} placeholder="Code postal" aria-label="Code postal" inputMode="numeric" maxLength={5} value={commune.codePostal} onChange={(e) => onChange({ ...commune, codePostal: e.target.value.replace(/\D/g, "") })} />
      <input
        className={clsx(entree, "w-28")}
        placeholder="INSEE (option)"
        aria-label="Code INSEE"
        maxLength={5}
        value={commune.insee ?? ""}
        onChange={(e) => onChange({ ...commune, insee: e.target.value.toUpperCase() || undefined })}
      />
      <BoutonRetirer onClick={onRetirer} libelle={`Retirer ${commune.nom || "la commune"}`} />
    </div>
  );
}
