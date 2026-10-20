import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SuiviCommande } from "@/components/commande/SuiviCommande";
import { JETON_SUIVI } from "@/lib/commande-schema";

export const metadata: Metadata = {
  title: "Suivi de commande",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PageSuivi({ params }: PageProps<"/suivi/[jeton]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Suivi params={params} />
    </Suspense>
  );
}

async function Suivi({ params }: { params: PageProps<"/suivi/[jeton]">["params"] }) {
  const { jeton } = await params;
  if (!JETON_SUIVI.test(jeton)) notFound();
  return <SuiviCommande jeton={jeton} />;
}
