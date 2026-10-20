import { sql } from "drizzle-orm";
import { connection } from "next/server";

import { base } from "@/db";

/** Sonde de santé (Docker, supervision) : le site répond et la base aussi. */
export async function GET() {
  await connection();
  try {
    const db = await base();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
