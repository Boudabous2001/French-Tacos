"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const REQUETE_MOBILE = "(max-width: 639px)";

function abonnerMedia(rappel: () => void) {
  const media = window.matchMedia(REQUETE_MOBILE);
  media.addEventListener("change", rappel);
  return () => media.removeEventListener("change", rappel);
}

export function useEstMobile() {
  return useSyncExternalStore(
    abonnerMedia,
    () => window.matchMedia(REQUETE_MOBILE).matches,
    () => true,
  );
}

const estMonte = () => true;
const abonnementVide = () => () => {};

const SELECTEUR_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let verrous = 0;

function verrouillerDefilement() {
  verrous += 1;
  if (verrous > 1) return;
  const largeurBarre = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = "hidden";
  if (largeurBarre > 0) document.body.style.paddingRight = `${largeurBarre}px`;
}

function deverrouillerDefilement() {
  verrous = Math.max(0, verrous - 1);
  if (verrous > 0) return;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

interface Props {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  children: ReactNode;
  /** « centre » : fenêtre au centre sur ordinateur ; « droite » : panneau latéral. Toujours par le bas sur mobile. */
  position?: "centre" | "droite";
  className?: string;
  /** Contenu de la poignée de glissement (en-tête de la feuille). */
  entete?: ReactNode;
  boutonFermer?: boolean;
}

/**
 * Feuille modale : glisse depuis le bas sur téléphone (fermeture au doigt),
 * fenêtre centrée ou panneau latéral sur grand écran. Accessible au clavier.
 */
export function Feuille({ ouvert, onFermer, titre, children, position = "centre", className, entete, boutonFermer = true }: Props) {
  const monte = useSyncExternalStore(abonnementVide, estMonte, () => false);
  const mobile = useEstMobile();
  const controles = useDragControls();
  const panneau = useRef<HTMLDivElement>(null);
  const fermerRef = useRef(onFermer);

  useEffect(() => {
    fermerRef.current = onFermer;
  });

  useEffect(() => {
    if (!ouvert) return;
    const precedent = document.activeElement as HTMLElement | null;
    verrouillerDefilement();
    const minuteur = window.setTimeout(() => {
      const premier = panneau.current?.querySelector<HTMLElement>("[data-focus-initial]") ?? panneau.current;
      premier?.focus({ preventScroll: true });
    }, 60);

    const clavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        fermerRef.current();
        return;
      }
      if (e.key !== "Tab" || !panneau.current) return;
      const elements = [...panneau.current.querySelectorAll<HTMLElement>(SELECTEUR_FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (elements.length === 0) return;
      const premier = elements[0];
      const dernier = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };
    document.addEventListener("keydown", clavier);
    return () => {
      window.clearTimeout(minuteur);
      document.removeEventListener("keydown", clavier);
      deverrouillerDefilement();
      precedent?.focus?.({ preventScroll: true });
    };
  }, [ouvert]);

  const finGlissement = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onFermer();
  };

  const lateral = !mobile && position === "droite";
  const animation = mobile
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : lateral
      ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
      : { initial: { opacity: 0, scale: 0.94, y: 24 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 12 } };

  if (!monte) return null;

  return createPortal(
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-nuit-950/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onFermer}
            aria-hidden
          />
          <div
            className={clsx(
              "pointer-events-none absolute inset-0 flex",
              mobile ? "items-end" : lateral ? "justify-end" : "items-center justify-center p-6",
            )}
          >
            <motion.div
              ref={panneau}
              role="dialog"
              aria-modal="true"
              aria-label={titre}
              tabIndex={-1}
              {...animation}
              transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.9 }}
              drag={mobile ? "y" : false}
              dragListener={false}
              dragControls={controles}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={finGlissement}
              className={clsx(
                "pointer-events-auto relative flex flex-col overflow-hidden bg-papier shadow-flottant outline-none",
                mobile && "max-h-[92dvh] w-full rounded-t-[1.75rem] pb-[env(safe-area-inset-bottom)]",
                lateral && "h-full w-full max-w-md",
                !mobile && !lateral && "max-h-[88vh] w-full max-w-xl rounded-[1.75rem]",
                className,
              )}
            >
              <div onPointerDown={(e) => mobile && controles.start(e)} className={clsx(mobile && "touch-none")}>
                {mobile && (
                  <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-2.5">
                    <span className="h-1.5 w-11 rounded-full bg-black/25" />
                  </div>
                )}
                {entete}
              </div>
              {boutonFermer && (
                <button
                  type="button"
                  onClick={onFermer}
                  className="absolute right-3 top-3 z-30 grid size-10 place-items-center rounded-full bg-white/90 text-encre shadow-carte backdrop-blur transition hover:scale-105 hover:bg-white"
                  aria-label="Fermer"
                >
                  <X className="size-5" />
                </button>
              )}
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
