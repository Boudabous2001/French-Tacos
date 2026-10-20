import { adminCourant } from "@/lib/serveur/auth";
import { ecouterCommandes } from "@/lib/serveur/bus";
import { erreurJson } from "@/lib/serveur/securite";

/** Flux temps réel (Server-Sent Events) de l'écran cuisine. */
export async function GET(requete: Request) {
  const admin = await adminCourant();
  if (!admin) return erreurJson("Non connecté.", 401);

  const encodeur = new TextEncoder();
  let fermer = () => {};

  const flux = new ReadableStream<Uint8Array>({
    start(controleur) {
      const envoyer = (texte: string) => {
        try {
          controleur.enqueue(encodeur.encode(texte));
        } catch {
          fermer();
        }
      };
      envoyer("retry: 3000\n\n");
      const arreterEcoute = ecouterCommandes((evenement) => envoyer(`event: commande\ndata: ${JSON.stringify(evenement)}\n\n`));
      // Battement régulier : garde la connexion ouverte à travers les proxys.
      const battement = setInterval(() => envoyer(": ping\n\n"), 25_000);
      fermer = () => {
        clearInterval(battement);
        arreterEcoute();
        try {
          controleur.close();
        } catch {
          /* déjà fermé */
        }
      };
      requete.signal.addEventListener("abort", () => fermer());
    },
    cancel() {
      fermer();
    },
  });

  return new Response(flux, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
