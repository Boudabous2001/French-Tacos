import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { AValider, Article, PageTexte } from "@/components/site/PageTexte";
import { lireReglages } from "@/lib/serveur/donnees";

export const metadata: Metadata = { title: "Mentions légales", alternates: { canonical: "/mentions-legales" } };

export default function PageMentions() {
  return (
    <PageTexte titre="Mentions légales">
      <Suspense fallback={null}>
        <Contenu />
      </Suspense>
    </PageTexte>
  );
}

async function Contenu() {
  await connection();
  const { restaurant: r } = await lireReglages();
  return (
    <Article>
      <AValider />
      <h2>Éditeur du site</h2>
      <p>
        <strong>{r.raisonSociale}</strong>, exploitant l&apos;enseigne {r.nom}
        <br />
        {r.adresse}, {r.codePostal} {r.ville}
        <br />
        SIRET : {r.siret} · TVA intracommunautaire : {r.tvaIntracom}
        <br />
        Téléphone : {r.telephone}
        {r.email && (
          <>
            {" "}
            · E-mail : {r.email}
          </>
        )}
      </p>
      <p>Responsable de la publication : {r.responsablePublication}</p>
      <h2>Hébergement</h2>
      <p>{process.env.HEBERGEUR ?? "Hébergeur à renseigner (nom, adresse et téléphone du fournisseur du serveur)."}</p>
      <h2>Conception et réalisation</h2>
      <p>{process.env.REALISATION ?? "Agence à renseigner."}</p>
      <h2>Propriété intellectuelle</h2>
      <p>
        Les marques, logos, photographies et textes de ce site appartiennent à {r.raisonSociale} ou à leurs auteurs. Toute reproduction sans autorisation
        est interdite.
      </p>
      <h2>Données personnelles</h2>
      <p>
        Le traitement des données de commande est décrit dans la <a href="/confidentialite" className="font-bold text-braise-700 underline">politique de confidentialité</a>.
      </p>
    </Article>
  );
}
