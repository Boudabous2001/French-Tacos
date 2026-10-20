"use client";

import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { useEffect } from "react";

import { usePanier } from "@/stores/panier";
import { useInterface } from "@/stores/interface";

export function Fournisseurs({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void Promise.resolve(usePanier.persist.rehydrate()).then(() => useInterface.getState().marquerHydrate());
  }, []);

  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 420, damping: 34 }}>
      {children}
      <Notifications />
    </MotionConfig>
  );
}

const ICONES = { succes: CircleCheck, info: Info, erreur: CircleAlert };

function Notifications() {
  const notifications = useInterface((e) => e.notifications);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-8"
    >
      <AnimatePresence initial={false}>
        {notifications.map((n) => {
          const Icone = ICONES[n.ton];
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.18 } }}
              className="flex items-center gap-2.5 rounded-full bg-nuit-900/95 px-5 py-3 text-sm font-semibold text-creme shadow-flottant ring-1 ring-white/10 backdrop-blur"
            >
              <Icone className={n.ton === "erreur" ? "size-5 text-red-400" : "size-5 text-ambre-400"} aria-hidden />
              {n.texte}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
