import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ImpressionAuto } from "@/components/admin/ImpressionAuto";
import { base } from "@/db";
import { euros } from "@/lib/argent";
import { telephoneLisible } from "@/lib/commande-schema";
import { heureParis, jourParis } from "@/lib/horaires";
import { exigerAdmin } from "@/lib/serveur/auth";
import { lireCommandeCuisine } from "@/lib/serveur/commandes";
import { chargerReglages } from "@/lib/serveur/donnees";

export const metadata: Metadata = { title: "Ticket" };

/** Ticket cuisine / livreur au format imprimante thermique 80 mm. */
export default function PageTicket({ params }: PageProps<"/admin/ticket/[id]">) {
  return (
    <Suspense fallback={null}>
      <Ticket params={params} />
    </Suspense>
  );
}

async function Ticket({ params }: { params: PageProps<"/admin/ticket/[id]">["params"] }) {
  await exigerAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [commande, reglages] = await Promise.all([lireCommandeCuisine(id), chargerReglages(await base())]);
  if (!commande) notFound();
  const creee = new Date(commande.creeLe);

  return (
    <div className="min-h-dvh bg-white p-4 text-black print:p-0">
      <ImpressionAuto />
      <article className="mx-auto w-[72mm] font-mono text-[12px] leading-snug">
        <header className="border-b border-dashed border-black pb-2 text-center">
          <p className="text-lg font-black uppercase">{reglages.restaurant.nom}</p>
          <p>{reglages.restaurant.telephone}</p>
        </header>
        <p className="mt-2 text-center text-3xl font-black">N° {commande.numero}</p>
        <p className="text-center text-base font-black uppercase">{commande.mode === "livraison" ? "Livraison" : "À emporter"}</p>
        <p className="text-center">
          {commande.creneau ? `POUR ${jourParis(new Date(commande.creneau))} ${heureParis(new Date(commande.creneau))}` : "DÈS QUE POSSIBLE"}
        </p>
        <p className="text-center text-[11px]">
          Reçue le {jourParis(creee)} à {heureParis(creee)}
        </p>

        <section className="mt-2 border-t border-dashed border-black pt-2">
          <p className="font-bold">
            {commande.clientPrenom} {commande.clientNom}
          </p>
          <p>{telephoneLisible(commande.clientTelephone)}</p>
          {commande.adresse && (
            <>
              <p className="mt-1 font-bold">{commande.adresse.libelle}</p>
              {commande.adresse.complement && <p>{commande.adresse.complement}</p>}
              {commande.adresse.instructions && <p>« {commande.adresse.instructions} »</p>}
            </>
          )}
        </section>

        {commande.note && <p className="mt-2 border-2 border-black p-1 font-bold">NOTE : {commande.note}</p>}

        <section className="mt-2 border-t border-dashed border-black pt-2">
          {commande.lignes.map((l) => (
            <div key={l.id} className="mb-1.5">
              <p className="flex justify-between font-bold">
                <span>
                  {l.quantite} x {l.nom}
                  {l.varianteNom ? ` (${l.varianteNom})` : ""}
                </span>
                <span>{euros(l.total)}</span>
              </p>
              {l.resume.map((g) => (
                <p key={g.groupe} className="pl-3">
                  {g.titre} : {g.choix.map((c) => (c.quantite > 1 ? `${c.nom} x${c.quantite}` : c.nom)).join(", ")}
                </p>
              ))}
            </div>
          ))}
        </section>

        <section className="mt-2 border-t border-dashed border-black pt-2">
          {commande.fraisLivraison > 0 && (
            <p className="flex justify-between">
              <span>Livraison</span>
              <span>{euros(commande.fraisLivraison)}</span>
            </p>
          )}
          <p className="flex justify-between text-base font-black">
            <span>TOTAL TTC</span>
            <span>{euros(commande.total)}</span>
          </p>
          <p className="mt-1 text-center font-bold uppercase">
            {commande.paiementStatut === "paye" ? "Payée en ligne" : commande.paiementStatut === "a_encaisser" ? "*** À ENCAISSER ***" : commande.paiementStatut}
          </p>
        </section>
      </article>
    </div>
  );
}
