/**
 * Accès à la base PostgreSQL.
 *
 * - Production : vrai PostgreSQL (DATABASE_URL=postgres://…), dans Docker sur le serveur.
 * - Développement : PGlite, un PostgreSQL embarqué dans un dossier local
 *   (.donnees/pglite) : rien à installer, mêmes migrations SQL qu'en production.
 *
 * La connexion s'ouvre au premier appel (jamais pendant la compilation) et
 * applique les migrations + la carte initiale si la base est vide.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";
import { preparerBase } from "./initialiser";

export type Base = NodePgDatabase<typeof schema>;

declare global {
  var __frenchTacosBase: Promise<Base> | undefined;
}

const DOSSIER_MIGRATIONS = path.join(process.cwd(), "drizzle");

async function ouvrir(): Promise<Base> {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    const [{ Pool }, { drizzle }, { migrate }] = await Promise.all([
      import("pg"),
      import("drizzle-orm/node-postgres"),
      import("drizzle-orm/node-postgres/migrator"),
    ]);
    const pool = new Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 15_000 });
    // Une connexion inactive coupée par le serveur (redémarrage, mise en veille de
    // l'hébergeur) ne doit jamais faire tomber le site : le pool en rouvre une.
    pool.on("error", (erreur) => console.error("[base] Connexion PostgreSQL perdue :", erreur.message));
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: DOSSIER_MIGRATIONS });
    return db;
  }

  if (process.env.NODE_ENV === "production" && process.env.AUTORISER_PGLITE !== "1") {
    throw new Error("DATABASE_URL (postgres://…) est obligatoire en production.");
  }

  const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);
  const dossier = process.env.PGLITE_DOSSIER ?? path.join(process.cwd(), ".donnees", "pglite");
  await mkdir(dossier, { recursive: true });
  const client = await PGlite.create(dossier);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: DOSSIER_MIGRATIONS });
  return db as unknown as Base;
}

/** Base prête à l'emploi (une seule connexion partagée par processus). */
export function base(): Promise<Base> {
  globalThis.__frenchTacosBase ??= ouvrir()
    .then(async (db) => {
      await preparerBase(db);
      return db;
    })
    .catch((erreur) => {
      globalThis.__frenchTacosBase = undefined;
      throw erreur;
    });
  return globalThis.__frenchTacosBase;
}

export { schema };
