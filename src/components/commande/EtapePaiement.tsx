"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { ArrowLeft, CreditCard, FlaskConical, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Bouton } from "@/components/ui/Bouton";
import { euros } from "@/lib/argent";

let chargementStripe: Promise<Stripe | null> | null = null;
const obtenirStripe = (cle: string) => (chargementStripe ??= loadStripe(cle, { locale: "fr" }));

export type Paiement = { type: "stripe"; clientSecret: string } | { type: "demo" };

interface Props {
  paiement: Paiement;
  jeton: string;
  numero: number;
  total: number;
  cleStripe: string | null;
  onRetour: () => void;
  onPaye: () => void;
}

export function EtapePaiement({ paiement, jeton, numero, total, cleStripe, onRetour, onPaye }: Props) {
  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-carte ring-1 ring-ligne sm:p-7" aria-labelledby="titre-paiement">
      <button type="button" onClick={onRetour} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-gris hover:text-encre">
        <ArrowLeft className="size-4" aria-hidden /> Modifier ma commande
      </button>
      <p className="text-sm font-semibold text-gris">Commande n° {numero}</p>
      <h2 id="titre-paiement" className="titre-display mt-1 text-4xl">
        Paiement
      </h2>
      <p className="mt-2 flex items-center gap-2 text-sm text-gris">
        <Lock className="size-4 text-emerald-600" aria-hidden />
        Paiement chiffré et sécurisé par Stripe. Nous ne voyons jamais ta carte.
      </p>
      <div className="mt-6">
        {paiement.type === "stripe" && cleStripe ? (
          <Elements
            stripe={obtenirStripe(cleStripe)}
            options={{
              clientSecret: paiement.clientSecret,
              locale: "fr",
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#fb6a0b",
                  colorText: "#1f1611",
                  colorDanger: "#dc2626",
                  borderRadius: "14px",
                  spacingUnit: "5px",
                  fontSizeBase: "16px",
                },
              },
            }}
          >
            <FormulaireStripe jeton={jeton} total={total} onPaye={onPaye} />
          </Elements>
        ) : (
          <PaiementDemo jeton={jeton} total={total} onPaye={onPaye} />
        )}
      </div>
    </section>
  );
}

function FormulaireStripe({ jeton, total, onPaye }: { jeton: string; total: number; onPaye: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  const payer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setEnvoi(true);
    setErreur(null);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/suivi/${jeton}` },
    });
    if (error) {
      setErreur(error.message ?? "Le paiement a échoué. Vérifie ta carte ou essaie un autre moyen de paiement.");
      setEnvoi(false);
      return;
    }
    onPaye();
    router.push(`/suivi/${jeton}`);
  };

  return (
    <form onSubmit={payer}>
      <PaymentElement options={{ layout: { type: "tabs" } }} onReady={() => setPret(true)} />
      {erreur && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-alerte" role="alert">
          {erreur}
        </p>
      )}
      <Bouton type="submit" taille="lg" className="mt-6 w-full" chargement={envoi} disabled={!stripe || !pret} icone={<Lock className="size-5" aria-hidden />}>
        Payer {euros(total)}
      </Bouton>
    </form>
  );
}

/** Paiement simulé : uniquement en développement, tant que les clés Stripe ne sont pas fournies. */
function PaiementDemo({ jeton, total, onPaye }: { jeton: string; total: number; onPaye: () => void }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const payer = async () => {
    setEnvoi(true);
    setErreur(null);
    const reponse = await fetch(`/api/commandes/${jeton}/demo`, { method: "POST" });
    if (!reponse.ok) {
      const json = (await reponse.json().catch(() => ({}))) as { erreur?: string };
      setErreur(json.erreur ?? "Paiement de démonstration impossible.");
      setEnvoi(false);
      return;
    }
    onPaye();
    router.push(`/suivi/${jeton}`);
  };

  return (
    <div>
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
        <FlaskConical className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>
          <strong>Mode démonstration.</strong> Les clés Stripe ne sont pas encore configurées : aucun paiement réel n&apos;est effectué.
        </p>
      </div>
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-nuit-800 to-nuit-950 p-5 text-creme shadow-flottant">
        <div className="flex items-center justify-between">
          <CreditCard className="size-8 text-ambre-400" aria-hidden />
          <span className="text-xs font-bold tracking-widest text-creme/60">CARTE DE TEST</span>
        </div>
        <p className="mt-6 font-mono text-lg tracking-[0.2em]">4242 4242 4242 4242</p>
        <p className="mt-2 text-xs text-creme/60">12/34 · 123</p>
      </div>
      {erreur && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-alerte" role="alert">
          {erreur}
        </p>
      )}
      <Bouton taille="lg" className="mt-6 w-full" chargement={envoi} onClick={payer} icone={<Lock className="size-5" aria-hidden />}>
        Simuler le paiement de {euros(total)}
      </Bouton>
    </div>
  );
}
