"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, LoaderCircle, MapPin, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { euros } from "@/lib/argent";
import type { AdresseChoisie } from "@/stores/panier";

interface Props {
  adresse: AdresseChoisie | null;
  onChoisir: (adresse: AdresseChoisie | null) => void;
  invalide?: boolean;
}

/** Saisie d'adresse avec suggestions (combobox accessible au clavier). */
export function ChampAdresse({ adresse, onChoisir, invalide }: Props) {
  const [texte, setTexte] = useState("");
  const [suggestions, setSuggestions] = useState<AdresseChoisie[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [surligne, setSurligne] = useState(-1);
  const idListe = useId();
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const requete = texte.trim();
    if (requete.length < 3) return;
    const controleur = new AbortController();
    const minuteur = window.setTimeout(async () => {
      setChargement(true);
      setErreur(null);
      try {
        const reponse = await fetch(`/api/adresse?q=${encodeURIComponent(requete)}`, { signal: controleur.signal });
        const json = (await reponse.json()) as { adresses?: AdresseChoisie[]; erreur?: string };
        if (!reponse.ok) throw new Error(json.erreur ?? "Recherche indisponible");
        setSuggestions(json.adresses ?? []);
        setSurligne(json.adresses?.length ? 0 : -1);
        setOuvert(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setErreur((e as Error).message);
      } finally {
        setChargement(false);
      }
    }, 250);
    return () => {
      controleur.abort();
      window.clearTimeout(minuteur);
    };
  }, [texte]);

  const visibles = texte.trim().length >= 3 ? suggestions : [];

  const choisir = (a: AdresseChoisie) => {
    onChoisir(a);
    setOuvert(false);
    setTexte("");
    setSuggestions([]);
  };

  const clavier = (e: React.KeyboardEvent) => {
    if (!ouvert || visibles.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSurligne((i) => (i + 1) % visibles.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSurligne((i) => (i - 1 + visibles.length) % visibles.length);
    } else if (e.key === "Enter" && surligne >= 0) {
      e.preventDefault();
      choisir(visibles[surligne]);
    } else if (e.key === "Escape") {
      setOuvert(false);
    }
  };

  if (adresse) {
    return (
      <div
        className={clsx(
          "flex items-start gap-3 rounded-2xl p-4 ring-1",
          adresse.zone ? "bg-emerald-50 ring-emerald-200" : "bg-red-50 ring-red-200",
        )}
      >
        <span className={clsx("grid size-10 shrink-0 place-items-center rounded-full", adresse.zone ? "bg-emerald-500 text-white" : "bg-alerte text-white")}>
          {adresse.zone ? <MapPin className="size-5" aria-hidden /> : <CircleAlert className="size-5" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-snug">{adresse.libelle}</p>
          {adresse.zone ? (
            <p className="mt-0.5 text-sm text-emerald-800">
              On livre ! Livraison {adresse.zone.frais === 0 ? "offerte" : euros(adresse.zone.frais)}
              {adresse.zone.gratuiteDes !== null && adresse.zone.frais > 0 ? `, offerte dès ${euros(adresse.zone.gratuiteDes)}` : ""} · minimum{" "}
              {euros(adresse.zone.minimum)}
            </p>
          ) : (
            <p className="mt-0.5 text-sm font-semibold text-alerte" role="alert">
              Désolé, cette adresse est hors de notre zone de livraison. Tu peux choisir « À emporter ».
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onChoisir(null);
            window.setTimeout(() => champ.current?.focus(), 50);
          }}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-braise-700 hover:bg-white"
        >
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gris" aria-hidden />
        <input
          ref={champ}
          type="text"
          inputMode="search"
          autoComplete="street-address"
          className="champ pl-12 pr-11"
          placeholder="N° et rue, ville"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={clavier}
          onFocus={() => visibles.length > 0 && setOuvert(true)}
          onBlur={() => window.setTimeout(() => setOuvert(false), 150)}
          role="combobox"
          aria-expanded={ouvert}
          aria-controls={idListe}
          aria-autocomplete="list"
          aria-activedescendant={surligne >= 0 ? `${idListe}-${surligne}` : undefined}
          aria-label="Adresse de livraison"
          aria-invalid={invalide || undefined}
        />
        {chargement && <LoaderCircle className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-braise-500" aria-hidden />}
      </div>
      {erreur && <p className="mt-2 text-sm text-alerte">{erreur}</p>}
      <AnimatePresence>
        {ouvert && texte.trim().length >= 3 && !chargement && (
          <motion.ul
            id={idListe}
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-flottant ring-1 ring-ligne"
          >
            {visibles.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gris">Aucune adresse trouvée. Essaie avec le numéro et la ville.</li>
            ) : (
              visibles.map((s, i) => (
                <li
                  key={`${s.libelle}-${i}`}
                  id={`${idListe}-${i}`}
                  role="option"
                  aria-selected={i === surligne}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choisir(s)}
                  onMouseEnter={() => setSurligne(i)}
                  className={clsx("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5", i === surligne && "bg-sable")}
                >
                  <MapPin className="size-4 shrink-0 text-gris" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.libelle}</span>
                    <span className={clsx("text-xs font-semibold", s.zone ? "text-emerald-700" : "text-alerte")}>
                      {s.zone ? `Livrable · ${s.zone.frais === 0 ? "livraison offerte" : euros(s.zone.frais)}` : "Hors zone de livraison"}
                    </span>
                  </span>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
