import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { AValider, Article, PageTexte } from "@/components/site/PageTexte";
import { lireReglages } from "@/lib/serveur/donnees";

export const metadata: Metadata = { title: "Conditions générales de vente", alternates: { canonical: "/cgv" } };

export default function PageCgv() {
  return (
    <PageTexte titre="Conditions générales de vente">
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
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent les commandes passées sur ce site auprès de {r.raisonSociale} (enseigne {r.nom}), {r.adresse}, {r.codePostal}{" "}
        {r.ville}, SIRET {r.siret}, pour une livraison à domicile ou un retrait au restaurant.
      </p>
      <h2>2. Produits et prix</h2>
      <p>
        Les produits sont décrits avec la plus grande exactitude possible ; les photographies sont non contractuelles. Les prix sont indiqués en euros
        toutes taxes comprises. Les frais de livraison éventuels sont affichés avant la validation de la commande. Le prix applicable est celui affiché au
        moment de la commande.
      </p>
      <h2>3. Commande</h2>
      <p>
        La commande est validée après acceptation des présentes conditions et, en cas de paiement en ligne, après confirmation du paiement. Un récapitulatif
        est affiché et, si une adresse e-mail est fournie, envoyé par e-mail. Le restaurant peut refuser une commande (rupture, affluence, adresse hors zone…)
        : le client en est informé et tout montant payé est intégralement remboursé.
      </p>
      <h2>4. Paiement</h2>
      <p>
        Le paiement en ligne est réalisé par carte bancaire, Apple Pay ou Google Pay via le prestataire sécurisé Stripe : le restaurant n&apos;a jamais accès
        aux données de la carte. Le paiement sur place, lorsqu&apos;il est proposé, s&apos;effectue en espèces ou par carte à la remise de la commande.
      </p>
      <h2>5. Livraison et retrait</h2>
      <p>
        La livraison est assurée dans les communes listées sur la page « Infos & livraison », avec un minimum de commande propre à chaque zone. Les délais
        annoncés sont indicatifs. Le client doit être joignable au numéro indiqué ; en cas d&apos;absence prolongée, la commande peut être considérée comme
        livrée. Pour un retrait, la commande est remise au comptoir sur présentation du numéro de commande.
      </p>
      <h2>6. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne s&apos;applique pas aux denrées susceptibles de se
        détériorer ou de se périmer rapidement, ce qui est le cas des repas préparés.
      </p>
      <h2>7. Réclamations</h2>
      <p>
        Toute réclamation (produit manquant, erreur, qualité) doit être signalée au restaurant au {r.telephone} le jour même. Une solution (remplacement,
        avoir ou remboursement) est proposée après vérification.
      </p>
      <h2>8. Médiation</h2>
      <p>
        En cas de litige non résolu, le client peut recourir gratuitement au médiateur de la consommation : <strong>coordonnées du médiateur à renseigner</strong>.
        La plateforme européenne de règlement en ligne des litiges est accessible à l&apos;adresse ec.europa.eu/consumers/odr.
      </p>
      <h2>9. Allergènes</h2>
      <p>Les informations sur les allergènes sont disponibles sur la page « Allergènes » et sur demande au restaurant avant toute commande.</p>
      <h2>10. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit français.</p>
    </Article>
  );
}
