"use client";

import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, Lock } from "lucide-react";
import { useActionState } from "react";

import { seConnecter } from "@/app/admin/actions";
import { Bouton } from "@/components/ui/Bouton";

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState(seConnecter, null);

  return (
    <form action={action} className="mt-8 space-y-4 rounded-[1.75rem] bg-nuit-800/80 p-6 ring-1 ring-white/10 backdrop-blur">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-2xl border border-white/10 bg-nuit-950 px-4 py-3 text-creme outline-none transition focus:border-braise-500 focus:ring-4 focus:ring-braise-500/20"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">Mot de passe</span>
        <input
          name="motDePasse"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-2xl border border-white/10 bg-nuit-950 px-4 py-3 text-creme outline-none transition focus:border-braise-500 focus:ring-4 focus:ring-braise-500/20"
        />
      </label>
      <AnimatePresence>
        {etat && !etat.ok && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm font-semibold text-red-400"
            role="alert"
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden /> {etat.message}
          </motion.p>
        )}
      </AnimatePresence>
      <Bouton type="submit" taille="lg" className="w-full" chargement={enCours} icone={<Lock className="size-5" aria-hidden />}>
        Se connecter
      </Bouton>
    </form>
  );
}
