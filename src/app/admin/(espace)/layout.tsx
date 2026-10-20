import { Suspense } from "react";

import { BarreAdmin } from "@/components/admin/BarreAdmin";
import { base } from "@/db";
import { exigerAdmin } from "@/lib/serveur/auth";
import { chargerReglages } from "@/lib/serveur/donnees";

export default function LayoutEspace({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-white/10 bg-nuit-900" />}>
        <Barre />
      </Suspense>
      <main className="mx-auto max-w-[1600px] px-3 pb-12 pt-4 sm:px-5">{children}</main>
    </>
  );
}

async function Barre() {
  const admin = await exigerAdmin();
  const reglages = await chargerReglages(await base());
  return <BarreAdmin nom={admin.nom} enPause={reglages.commandes.enPause} />;
}
