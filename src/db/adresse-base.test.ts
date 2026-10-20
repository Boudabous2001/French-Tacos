import { describe, expect, it } from "vitest";

import { analyserAdresseBase } from "./adresse-base";

const NEON = "postgresql://neondb_owner:Ab12Cd34@ep-cool-lake-123.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

describe("DATABASE_URL", () => {
  it("accepte une chaîne Neon telle quelle", () => {
    expect(analyserAdresseBase(NEON)).toEqual({ type: "postgres", url: NEON });
  });

  it("corrige les collages courants : commande psql, guillemets, espaces, retour à la ligne", () => {
    expect(analyserAdresseBase(`psql '${NEON}'`)).toEqual({ type: "postgres", url: NEON });
    expect(analyserAdresseBase(`"${NEON}"`)).toEqual({ type: "postgres", url: NEON });
    expect(analyserAdresseBase(`  ${NEON}\n`)).toEqual({ type: "postgres", url: NEON });
    expect(analyserAdresseBase("DATABASE_URL=" + NEON)).toEqual({ type: "postgres", url: NEON });
  });

  it("accepte aussi le préfixe postgres://", () => {
    expect(analyserAdresseBase("postgres://u:p@localhost:5432/base")).toMatchObject({ type: "postgres" });
  });

  it("signale une valeur absente", () => {
    expect(analyserAdresseBase(undefined)).toEqual({ type: "absente" });
    expect(analyserAdresseBase("   ")).toEqual({ type: "absente" });
  });

  it("signale un mot de passe masqué", () => {
    const resultat = analyserAdresseBase("postgresql://neondb_owner:************@ep-x.neon.tech/neondb?sslmode=require");
    expect(resultat.type).toBe("invalide");
    if (resultat.type === "invalide") expect(resultat.raison).toContain("Show password");
  });

  it("refuse une valeur sans adresse, sans jamais en recopier le contenu", () => {
    const resultat = analyserAdresseBase("Ab12Cd34secret");
    expect(resultat.type).toBe("invalide");
    if (resultat.type === "invalide") expect(resultat.raison).not.toContain("Ab12Cd34");
    const indice = analyserAdresseBase("host=ep-x.neon.tech user=neondb_owner");
    if (indice.type === "invalide") expect(indice.raison).not.toContain("neondb_owner");
  });
});
