import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { AValider, Article, PageTexte } from "@/components/site/PageTexte";
import { lireReglages } from "@/lib/serveur/donnees";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

export default function PageConfidentialite() {
  return (
    <PageTexte titre="Confidentialité">
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
      <h2>Responsable du traitement</h2>
      <p>
        {r.raisonSociale} ({r.nom}), {r.adresse}, {r.codePostal} {r.ville}. Contact : {r.email || r.telephone}.
      </p>
      <h2>Données collectées et finalités</h2>
      <ul>
        <li>Prénom, nom, téléphone : préparer la commande et vous joindre en cas de besoin.</li>
        <li>Adresse et instructions : livrer la commande.</li>
        <li>E-mail (facultatif) : envoyer la confirmation et le suivi.</li>
        <li>Contenu de la commande et montant : exécution de la vente, comptabilité.</li>
      </ul>
      <p>Base légale : l&apos;exécution du contrat de vente et les obligations comptables du restaurant.</p>
      <h2>Paiement</h2>
      <p>
        Les paiements en ligne sont traités par Stripe, qui agit en tant que prestataire de paiement et lutte contre la fraude. Les données bancaires ne
        transitent jamais par nos serveurs.
      </p>
      <h2>Durées de conservation</h2>
      <ul>
        <li>Données de commande : 3 ans à compter de la dernière commande, puis anonymisation.</li>
        <li>Pièces comptables : 10 ans, conformément à la loi.</li>
      </ul>
      <h2>Destinataires</h2>
      <p>
        L&apos;équipe du restaurant, et ses sous-traitants techniques : hébergeur du site, service d&apos;envoi d&apos;e-mails et Stripe. Aucune donnée
        n&apos;est vendue ni utilisée à des fins publicitaires.
      </p>
      <h2>Cookies et stockage local</h2>
      <p>
        Ce site n&apos;utilise aucun cookie publicitaire ni de mesure d&apos;audience. Votre panier et vos coordonnées sont mémorisés uniquement sur votre
        appareil pour faciliter vos prochaines commandes. Stripe dépose des cookies strictement nécessaires à la sécurité des paiements.
      </p>
      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation et d&apos;opposition. Pour l&apos;exercer, contactez-nous
        à l&apos;adresse ci-dessus. Vous pouvez également saisir la CNIL (www.cnil.fr).
      </p>
    </Article>
  );
}
