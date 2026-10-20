import { Bike, Clock, CreditCard, MapPin, Phone, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageTexte } from "@/components/site/PageTexte";
import { classesBouton } from "@/components/ui/Bouton";
import { euros } from "@/lib/argent";
import { JOURS, texteJour } from "@/lib/horaires";
import { lireReglages } from "@/lib/serveur/donnees";

export const metadata: Metadata = {
  title: "Infos, horaires et zones de livraison",
  description: "Horaires d'ouverture, adresse, communes livrées, frais et minimum de commande de French Tacos.",
  alternates: { canonical: "/infos" },
};

export default function PageInfos() {
  return (
    <PageTexte surtitre="Tout ce qu'il faut savoir" titre="Infos & livraison">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[1.75rem] bg-sable" />}>
        <Contenu />
      </Suspense>
    </PageTexte>
  );
}

async function Contenu() {
  await connection();
  const { restaurant, horaires, fermetures, zones, modes, paiement } = await lireReglages();
  const zonesActives = zones.filter((z) => z.active);
  const itineraire = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.adresse} ${restaurant.codePostal} ${restaurant.ville}`)}`;
  const aVenir = fermetures.filter((f) => f.au >= new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Carte Icone={MapPin} titre="Adresse">
          <p>{restaurant.adresse}</p>
          <p>
            {restaurant.codePostal} {restaurant.ville}
          </p>
          <a href={itineraire} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-bold text-braise-700 underline underline-offset-2">
            Itinéraire
          </a>
        </Carte>
        <Carte Icone={Phone} titre="Téléphone">
          <a href={`tel:${restaurant.telephone.replace(/\s/g, "")}`} className="text-lg font-extrabold">
            {restaurant.telephone}
          </a>
          <p className="mt-1 text-sm text-gris">Pour toute question sur une commande en cours.</p>
        </Carte>
      </div>

      <Carte Icone={Clock} titre="Horaires">
        <dl className="divide-y divide-ligne">
          {JOURS.map((jour) => (
            <div key={jour} className="flex justify-between gap-4 py-2 text-sm">
              <dt className="font-semibold capitalize">{jour}</dt>
              <dd className="text-right tabular-nums">{texteJour(horaires[jour])}</dd>
            </div>
          ))}
        </dl>
        {aVenir.length > 0 && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-bold">Fermetures exceptionnelles</p>
            {aVenir.map((f) => (
              <p key={`${f.du}-${f.au}`}>
                Du {new Date(f.du).toLocaleDateString("fr-FR")} au {new Date(f.au).toLocaleDateString("fr-FR")}
                {f.motif ? ` · ${f.motif}` : ""}
              </p>
            ))}
          </div>
        )}
      </Carte>

      {modes.livraison && (
        <Carte Icone={Bike} titre="Zones de livraison">
          {zonesActives.length === 0 ? (
            <p className="text-gris">La livraison n&apos;est pas disponible pour le moment.</p>
          ) : (
            <>
              <ul className="space-y-3 sm:hidden">
                {zonesActives.map((z) => (
                  <li key={z.id} className="rounded-2xl bg-sable p-4 text-sm">
                    <p className="font-bold">{z.communes.map((c) => `${c.nom} (${c.codePostal})`).join(", ")}</p>
                    <p className="mt-1 text-gris">
                      Livraison {z.frais === 0 ? "offerte" : euros(z.frais)} · minimum {euros(z.minimum)}
                      {z.gratuiteDes !== null && z.frais > 0 ? ` · offerte dès ${euros(z.gratuiteDes)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[30rem] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-gris">
                      <th className="pb-2 font-bold">Communes</th>
                      <th className="pb-2 font-bold">Frais</th>
                      <th className="pb-2 font-bold">Minimum</th>
                      <th className="pb-2 font-bold">Offerte dès</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ligne">
                    {zonesActives.map((z) => (
                      <tr key={z.id}>
                        <td className="py-3 pr-4 font-semibold">{z.communes.map((c) => `${c.nom} (${c.codePostal})`).join(", ")}</td>
                        <td className="py-3 pr-4 tabular-nums">{z.frais === 0 ? "Offerte" : euros(z.frais)}</td>
                        <td className="py-3 pr-4 tabular-nums">{euros(z.minimum)}</td>
                        <td className="py-3 tabular-nums">{z.gratuiteDes === null ? "—" : euros(z.gratuiteDes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Carte>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {modes.emporter && (
          <Carte Icone={Store} titre="À emporter">
            <p>Commande en ligne, choisis ton heure et récupère ta commande au comptoir, sans attendre.</p>
          </Carte>
        )}
        <Carte Icone={CreditCard} titre="Paiement">
          <ul className="space-y-1">
            {paiement.enLigne && <li>Carte bancaire, Apple Pay et Google Pay en ligne, sécurisé par Stripe</li>}
            {paiement.surPlace && <li>Espèces ou carte au comptoir ou au livreur</li>}
          </ul>
        </Carte>
      </div>

      <div className="pt-4 text-center">
        <Link href="/carte" className={classesBouton("primaire", "lg")}>
          Voir la carte
        </Link>
      </div>
    </div>
  );
}

function Carte({ Icone, titre, children }: { Icone: typeof Clock; titre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-carte ring-1 ring-ligne sm:p-6">
      <h2 className="mb-3 flex items-center gap-2.5 text-lg font-extrabold">
        <span className="grid size-9 place-items-center rounded-xl bg-nuit-900 text-ambre-400">
          <Icone className="size-[1.1rem]" aria-hidden />
        </span>
        {titre}
      </h2>
      {children}
    </section>
  );
}
