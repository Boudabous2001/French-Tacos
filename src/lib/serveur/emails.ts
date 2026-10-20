import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { euros } from "@/lib/argent";
import { heureParis, jourParis } from "@/lib/horaires";

/**
 * Envoi des e-mails transactionnels par SMTP (SMTP_URL = smtp://utilisateur:motdepasse@hote:587).
 * Sans configuration, les messages sont seulement écrits dans les journaux.
 */
let transporteur: Transporter | null | undefined;

function transport(): Transporter | null {
  if (transporteur !== undefined) return transporteur;
  transporteur = process.env.SMTP_URL ? nodemailer.createTransport(process.env.SMTP_URL) : null;
  return transporteur;
}

const echapper = (texte: string) =>
  texte.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export interface CommandeCourriel {
  numero: number;
  jeton: string;
  mode: string;
  clientPrenom: string;
  clientEmail: string;
  clientTelephone: string;
  adresse: { libelle: string; complement: string; instructions: string } | null;
  creneau: Date | null;
  note: string;
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  paiementMode: string;
  lignes: { nom: string; varianteNom: string | null; details: string; quantite: number; total: number }[];
}

function gabarit(titre: string, contenu: string, restaurant: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#fffaf4;font-family:Arial,Helvetica,sans-serif;color:#1f1611">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eadfd3">
<tr><td style="background:#120a06;padding:24px;text-align:center">
<div style="font-size:26px;font-weight:900;letter-spacing:1px;color:#f6e0c0">FRENCH <span style="color:#eb9c4f">TACOS</span></div></td></tr>
<tr><td style="padding:28px 24px"><h1 style="margin:0 0 16px;font-size:22px">${titre}</h1>${contenu}</td></tr>
<tr><td style="padding:16px 24px;background:#fff6ed;font-size:12px;color:#7a6a5f;text-align:center">${echapper(restaurant)}</td></tr>
</table></td></tr></table></body></html>`;
}

function tableauLignes(c: CommandeCourriel) {
  const lignes = c.lignes
    .map(
      (l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f1e7dc"><strong>${l.quantite} × ${echapper(l.nom)}</strong>${
        l.varianteNom ? ` (${echapper(l.varianteNom)})` : ""
      }${l.details ? `<br><span style="color:#7a6a5f;font-size:13px">${echapper(l.details)}</span>` : ""}</td>
<td style="padding:8px 0;border-bottom:1px solid #f1e7dc;text-align:right;white-space:nowrap">${euros(l.total)}</td></tr>`,
    )
    .join("");
  const frais = c.fraisLivraison > 0 ? `<tr><td style="padding:6px 0">Livraison</td><td style="text-align:right">${euros(c.fraisLivraison)}</td></tr>` : "";
  return `<table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px">${lignes}${frais}
<tr><td style="padding:10px 0;font-size:16px"><strong>Total</strong></td><td style="text-align:right;font-size:16px"><strong>${euros(c.total)}</strong></td></tr></table>`;
}

function quand(c: CommandeCourriel) {
  if (!c.creneau) return "dès que possible";
  return `${jourParis(c.creneau)} à ${heureParis(c.creneau)}`;
}

async function envoyer(message: { a: string; sujet: string; html: string; texte: string }) {
  const t = transport();
  const expediteur = process.env.EMAIL_EXPEDITEUR ?? "French Tacos <no-reply@localhost>";
  if (!t) {
    console.info(`[e-mail non envoyé : SMTP absent] À ${message.a} — ${message.sujet}`);
    return;
  }
  try {
    await t.sendMail({ from: expediteur, to: message.a, subject: message.sujet, html: message.html, text: message.texte });
  } catch (erreur) {
    console.error("[e-mail] Échec d'envoi :", erreur);
  }
}

export async function courrielConfirmationClient(c: CommandeCourriel, urlSuivi: string, restaurant: string) {
  if (!c.clientEmail) return;
  const mode = c.mode === "livraison" ? `Livraison au ${echapper(c.adresse?.libelle ?? "")}` : "À emporter au restaurant";
  const contenu = `<p style="margin:0 0 12px">Merci ${echapper(c.clientPrenom)} ! Ta commande <strong>n° ${c.numero}</strong> est bien reçue.</p>
<p style="margin:0 0 16px;color:#7a6a5f">${mode} · ${quand(c)}<br>Paiement : ${c.paiementMode === "en_ligne" ? "réglé en ligne" : "à régler sur place"}</p>
${tableauLignes(c)}
<p style="margin:24px 0 0;text-align:center"><a href="${urlSuivi}" style="display:inline-block;background:#fb6a0b;color:#fff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px">Suivre ma commande</a></p>`;
  await envoyer({
    a: c.clientEmail,
    sujet: `Commande n° ${c.numero} confirmée – French Tacos`,
    html: gabarit("Commande confirmée 🔥", contenu, restaurant),
    texte: `Merci ${c.clientPrenom} ! Ta commande n° ${c.numero} est bien reçue (${quand(c)}). Total : ${euros(c.total)}. Suivi : ${urlSuivi}`,
  });
}

export async function courrielNouvelleCommandeRestaurant(c: CommandeCourriel, urlAdmin: string, destinataire: string) {
  if (!destinataire) return;
  const adresse = c.adresse
    ? `<p style="margin:0 0 12px"><strong>${echapper(c.adresse.libelle)}</strong>${c.adresse.complement ? `<br>${echapper(c.adresse.complement)}` : ""}${
        c.adresse.instructions ? `<br><em>${echapper(c.adresse.instructions)}</em>` : ""
      }</p>`
    : "";
  const contenu = `<p style="margin:0 0 8px">${c.mode === "livraison" ? "🛵 Livraison" : "🥡 À emporter"} · ${quand(c)}</p>
<p style="margin:0 0 12px">${echapper(c.clientPrenom)} · ${echapper(c.clientTelephone)}</p>${adresse}
${c.note ? `<p style="margin:0 0 12px;padding:10px;background:#fff6ed;border-radius:8px">${echapper(c.note)}</p>` : ""}
${tableauLignes(c)}
<p style="margin:24px 0 0;text-align:center"><a href="${urlAdmin}" style="display:inline-block;background:#120a06;color:#f6e0c0;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px">Ouvrir l'écran commandes</a></p>`;
  await envoyer({
    a: destinataire,
    sujet: `🔔 Nouvelle commande n° ${c.numero} – ${euros(c.total)}`,
    html: gabarit(`Nouvelle commande n° ${c.numero}`, contenu, "Back-office French Tacos"),
    texte: `Nouvelle commande n° ${c.numero} (${c.mode}) – ${euros(c.total)} – ${urlAdmin}`,
  });
}

export async function courrielAnnulationClient(c: CommandeCourriel, motif: string, rembourse: boolean, restaurant: string) {
  if (!c.clientEmail) return;
  const contenu = `<p style="margin:0 0 12px">Désolé ${echapper(c.clientPrenom)}, ta commande <strong>n° ${c.numero}</strong> a dû être annulée.</p>
${motif ? `<p style="margin:0 0 12px;padding:10px;background:#fff6ed;border-radius:8px">${echapper(motif)}</p>` : ""}
<p style="margin:0">${rembourse ? "Le remboursement a été lancé : il apparaît sur ton compte sous 5 à 10 jours." : "Aucun montant ne t'a été prélevé."}</p>`;
  await envoyer({
    a: c.clientEmail,
    sujet: `Commande n° ${c.numero} annulée – French Tacos`,
    html: gabarit("Commande annulée", contenu, restaurant),
    texte: `Ta commande n° ${c.numero} a été annulée. ${motif} ${rembourse ? "Remboursement lancé." : ""}`,
  });
}
