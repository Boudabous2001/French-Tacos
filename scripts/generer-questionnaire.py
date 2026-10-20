"""Génère le questionnaire client : docs/questionnaire-client.html (à remplir dans le navigateur, imprimable).

Usage : python scripts/generer-questionnaire.py
PDF : ouvrir la page dans Chrome > Imprimer > Enregistrer en PDF, ou en ligne de commande :
  chrome --headless=new --no-pdf-header-footer --print-to-pdf=docs/questionnaire-client.pdf docs/questionnaire-client.html
"""
import base64
import html
import io
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent


def badge_jpeg() -> bytes:
    image = Image.open(REPO / "public" / "images" / "marque" / "badge.webp").convert("RGB")
    tampon = io.BytesIO()
    image.resize((220, 220), Image.Resampling.LANCZOS).save(tampon, "JPEG", quality=80, optimize=True)
    return tampon.getvalue()

# (texte, bloquant, champ)  champ : "court" | "long" | None
SECTIONS = [
    ("Entreprise et mentions légales", "Obligatoires pour vendre en ligne.", [
        ("Raison sociale et forme juridique (SARL, SAS, EI…)", True, "court"),
        ("SIRET et numéro de TVA intracommunautaire", True, "court"),
        ("Adresse exacte du restaurant", True, "court"),
        ("Nom du gérant (responsable de la publication du site)", True, "court"),
        ("Téléphone affiché aux clients", True, "court"),
        ("E-mail de contact public", True, "court"),
        ("E-mail(s) qui reçoivent l'alerte « nouvelle commande »", True, "court"),
        ("Médiateur de la consommation : obligatoire pour la vente en ligne aux particuliers (CM2C, Medicys, AME Conso… environ 50 à 150 € par an). Lequel ?", True, "court"),
        ("Coordonnées du comptable, pour valider les taux de TVA (10 % plats, 5,5 % boissons fermées, à confirmer)", False, "court"),
    ]),
    ("Identité visuelle", "Pour un rendu vraiment professionnel.", [
        ("Logo en fichier vectoriel (AI, SVG, EPS, PDF) ou PNG haute définition sur fond transparent", True, None),
        ("Couleurs officielles, si elles existent (relevées sur l'affiche : orange #FB6A0B, ambre #EB9C4F, crème #F6E0C0, noir #120A06)", False, "court"),
        ("Photos des produits en haute définition. Recommandé : un shooting photo d'une demi-journée pour toute la carte", False, "court"),
        ("Photos de la devanture, de la salle, de l'équipe", False, None),
        ("Le site tutoie le client, comme l'affiche (« Compose ton tacos »). Validé ?", False, "court"),
        ("Un court texte « notre histoire » (2 ou 3 phrases), si souhaité", False, "long"),
    ]),
    ("Nom de domaine et présence en ligne", "Le domaine doit être au nom du restaurant.", [
        ("Nom de domaine souhaité. Déjà acheté ? Chez quel fournisseur ?", True, "court"),
        ("Adresse d'envoi des confirmations (ex. commandes@domaine.fr) et fournisseur de messagerie", True, "court"),
        ("Fiche Google Business Profile : existe-t-elle ? Lien vers les avis Google", False, "court"),
        ("Liens Instagram, Facebook, TikTok, Snapchat", False, "long"),
    ]),
    ("La carte", "La carte de l'affiche est déjà saisie : 10 catégories, 43 produits. Merci de la relire.", [
        ("Valider chaque nom et chaque prix", True, None),
        ("Composition exacte de chaque produit", True, "long"),
        ("Tacos : sauce fromagère et frites toujours incluses ? Combien de sauces au maximum ? Deux fois la même viande possible ?", True, "long"),
        ("Suppléments : 1 € pièce pour tous ? Même liste pour les tacos et les burgers ?", False, "court"),
        ("Burgers : le menu à +3 € comprend frites + canette ? Quelle taille ?", False, "court"),
        ("Sandwichs, paninis, galettes : contenu du « Menu » ? Crudités modifiables (sans oignons…) ?", False, "court"),
        ("Boissons proposées : marques et parfums par format (canette 33 cl, 50 cl, 1,5 L)", True, "long"),
        ("Menu enfant : quelle boisson, quelle compote ? Desserts : quels parfums ?", False, "court"),
        ("Produits à ajouter (frites seules, menus tacos, offres du moment…)", False, "long"),
        ("Produits à mettre en avant (« Populaire », « Nouveau »)", False, "court"),
        ("Viande halal certifiée ? Par quel organisme ? (la mention n'est affichée qu'avec un justificatif)", False, "court"),
        ("Allergènes de chaque produit parmi les 14 réglementaires (obligation légale)", True, "long"),
        ("Les prix en ligne sont-ils les mêmes qu'au comptoir ?", False, "court"),
    ]),
    ("Horaires", None, [
        ("Horaires par jour (midi et soir) et jours de fermeture", True, "long"),
        ("Horaires de livraison différents des horaires d'ouverture ?", False, "court"),
        ("Dernière commande acceptée combien de temps avant la fermeture ?", False, "court"),
        ("Commande à l'avance autorisée (plus tard dans la journée, le lendemain) ?", False, "court"),
        ("Congés et fermetures exceptionnelles déjà prévus", False, "court"),
        ("Temps de préparation moyen. Faut-il limiter le nombre de commandes par créneau de 15 min en période de rush ?", False, "court"),
    ]),
    ("Livraison", None, [
        ("Le restaurant livre-t-il lui-même ? Avec combien de livreurs ?", True, "court"),
        ("Service de coursiers à connecter (Uber Direct, Stuart) ? Développement séparé, facturé à la course par le prestataire", False, "court"),
        ("Communes ou quartiers livrés", True, "long"),
        ("Pour chaque zone : frais, minimum de commande, livraison offerte à partir de, temps de trajet moyen", True, "long"),
        ("Distance maximale de livraison", False, "court"),
        ("Le livreur encaisse-t-il (espèces, terminal de paiement mobile) ?", False, "court"),
    ]),
    ("Paiement", "Le compte Stripe doit être ouvert au nom du restaurant.", [
        ("Création du compte Stripe : pièce d'identité du gérant, Kbis, IBAN. Frais : environ 1,5 % + 0,25 € par paiement, sans abonnement", True, None),
        ("Paiement sur place (au livreur ou au comptoir) en plus du paiement en ligne ?", True, "court"),
        ("Titres-restaurant (Swile, Edenred, Up, Pluxee…) : au comptoir ou au livreur sur terminal, ou faut-il étudier le paiement en ligne ?", False, "court"),
        ("Faut-il envoyer au client un reçu détaillé avec la TVA ?", False, "court"),
    ]),
    ("Organisation en cuisine", None, [
        ("Appareil de réception des commandes : tablette en cuisine conseillée", False, "court"),
        ("Imprimante de tickets : modèle (Epson TM-m30, Star TSP100…) ?", False, "court"),
        ("Logiciel de caisse actuel : faut-il y faire remonter les commandes ?", False, "court"),
        ("Personnes ayant accès au back-office (une adresse e-mail par personne)", False, "long"),
    ]),
    ("Messages aux clients", None, [
        ("SMS de confirmation et « commande prête » en option (environ 0,05 à 0,08 € le SMS). Souhaité ?", False, "court"),
    ]),
    ("Fidélité et marketing (seconde phase, à chiffrer)", None, [
        ("Compte client et historique des commandes", False, None),
        ("Programme de fidélité (points, 10e tacos offert…)", False, None),
        ("Codes promo et offre de lancement", False, None),
        ("Newsletter, avis clients après commande", False, None),
        ("Communes à viser en priorité pour le référencement local", False, "court"),
    ]),
    ("Hébergement et maintenance", None, [
        ("Serveur dédié : environ 6 à 15 € par mois (OVHcloud, Hetzner, Scaleway…), compte au nom du restaurant", True, None),
        ("Nom de domaine : environ 10 à 15 € par an", True, None),
        ("Contrat de maintenance (mises à jour de sécurité, sauvegardes, support, petites évolutions)", False, None),
        ("Interlocuteur technique côté restaurant", False, "court"),
    ]),
    ("Planning", None, [
        ("Date de lancement souhaitée", True, "court"),
        ("Une semaine de recette avec de vraies commandes de test avant l'ouverture", False, None),
        ("Formation de l'équipe au back-office (environ 30 min) : date à caler", False, "court"),
    ]),
]

e = html.escape
blocs = []
compteur = 0
for i, (titre, intro, items) in enumerate(SECTIONS, start=1):
    lignes = []
    for texte, bloquant, champ in items:
        compteur += 1
        ident = f"q{compteur}"
        badge = '<span class="bloquant">Bloquant</span>' if bloquant else ""
        reponse = ""
        if champ:
            rangs = 3 if champ == "long" else 1
            reponse = f'<textarea id="{ident}-r" data-cle="{ident}-r" rows="{rangs}" aria-label="Réponse" placeholder="Votre réponse…"></textarea>'
        lignes.append(
            f'<li class="q{" q-bloquant" if bloquant else ""}"><label class="ligne"><input type="checkbox" data-cle="{ident}"'
            f' aria-label="Fait"><span class="texte">{e(texte)}</span>{badge}</label>{reponse}</li>'
        )
    intro_html = f'<p class="intro-section">{e(intro)}</p>' if intro else ""
    blocs.append(
        f'<section class="section"><h2><span class="num">{i:02d}</span>{e(titre)}</h2>{intro_html}<ol class="questions">{"".join(lignes)}</ol></section>'
    )

badge64 = base64.b64encode(badge_jpeg()).decode()

page = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>French Tacos – Informations pour le site</title>
<style>
:root {{
  --orange: #fb6a0b; --orange-clair: #fff3e6; --ambre: #eb9c4f; --creme: #f6e0c0;
  --nuit: #120a06; --encre: #1f1611; --gris: #77675c; --ligne: #eee2d4; --papier: #fffaf4; --vert: #16a34a;
}}
* {{ box-sizing: border-box; }}
html {{ -webkit-text-size-adjust: 100%; }}
body {{ margin: 0; background: var(--papier); color: var(--encre); font: 15px/1.55 "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; }}
.page {{ max-width: 860px; margin: 0 auto; padding: 0 16px 64px; }}
.titre {{ font-family: Impact, "Anton", "Arial Narrow Bold", "Arial Black", sans-serif; text-transform: uppercase; letter-spacing: .01em; font-weight: 400; line-height: 1; }}
header.bandeau {{ background: radial-gradient(60% 120% at 80% 0%, rgba(251,106,11,.35), transparent 70%), var(--nuit); color: var(--creme); }}
header.bandeau .page {{ display: flex; gap: 24px; align-items: center; padding-top: 32px; padding-bottom: 32px; }}
header img {{ width: 96px; height: 96px; border-radius: 50%; box-shadow: 0 0 0 2px rgba(235,156,79,.5), 0 0 40px -6px rgba(251,106,11,.8); flex-shrink: 0; }}
header h1 {{ margin: 0; font-size: 40px; color: #fff; }}
header h1 span {{ color: var(--orange); }}
header p {{ margin: 8px 0 0; color: rgba(246,224,192,.8); max-width: 560px; }}
.outils {{ position: sticky; top: 0; z-index: 5; background: rgba(255,250,244,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--ligne); }}
.outils .page {{ display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding-top: 12px; padding-bottom: 12px; }}
.progression {{ flex: 1; min-width: 200px; }}
.progression small {{ color: var(--gris); font-weight: 600; }}
.barre {{ height: 8px; border-radius: 99px; background: var(--ligne); overflow: hidden; margin-top: 4px; }}
.barre span {{ display: block; height: 100%; width: 0; background: linear-gradient(90deg, var(--ambre), var(--orange)); transition: width .3s; }}
button {{ font: inherit; font-weight: 700; border: 0; border-radius: 99px; padding: 10px 18px; cursor: pointer; }}
.principal {{ background: var(--orange); color: #fff; box-shadow: 0 8px 20px -10px rgba(251,106,11,.9); }}
.secondaire {{ background: transparent; color: var(--gris); }}
.encart {{ margin: 24px 0 8px; display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }}
.encart div {{ background: #fff; border: 1px solid var(--ligne); border-radius: 18px; padding: 16px 18px; }}
.encart h3 {{ margin: 0 0 6px; font-size: 15px; }}
.encart p {{ margin: 0; color: var(--gris); font-size: 14px; }}
.section {{ background: #fff; border: 1px solid var(--ligne); border-radius: 22px; padding: 20px 22px; margin-top: 16px; }}
.section h2, .intro-section {{ break-after: avoid; page-break-after: avoid; }}
.section h2 {{ margin: 0; display: flex; align-items: center; gap: 12px; font-size: 19px; }}
.num {{ display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--nuit); color: var(--ambre); font-size: 13px; flex-shrink: 0; }}
.intro-section {{ margin: 6px 0 0 46px; color: var(--gris); font-size: 14px; }}
.questions {{ list-style: none; margin: 14px 0 0; padding: 0; }}
.q {{ padding: 10px 0; border-top: 1px dashed var(--ligne); break-inside: avoid; }}
.q:first-child {{ border-top: 0; }}
.ligne {{ display: flex; gap: 12px; align-items: flex-start; cursor: pointer; }}
.ligne input {{ width: 20px; height: 20px; margin: 2px 0 0; accent-color: var(--orange); flex-shrink: 0; }}
.texte {{ flex: 1; }}
.ligne input:checked + .texte {{ color: var(--gris); text-decoration: line-through; text-decoration-color: rgba(119,103,92,.5); }}
.bloquant {{ flex-shrink: 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: #b93e08; background: var(--orange-clair); border-radius: 99px; padding: 3px 8px; margin-top: 1px; }}
textarea {{ display: block; width: calc(100% - 32px); margin: 8px 0 0 32px; font: inherit; color: var(--encre); background: var(--papier); border: 1.5px solid var(--ligne); border-radius: 12px; padding: 8px 12px; resize: vertical; }}
textarea:focus {{ outline: none; border-color: var(--orange); box-shadow: 0 0 0 4px rgba(251,106,11,.15); }}
footer {{ margin-top: 28px; padding: 20px 22px; border-radius: 22px; background: var(--nuit); color: var(--creme); }}
footer strong {{ color: #fff; }}
.date {{ color: var(--gris); font-size: 13px; margin-top: 16px; }}
@media (max-width: 640px) {{
  header.bandeau .page {{ flex-direction: column; align-items: flex-start; }}
  header h1 {{ font-size: 32px; }}
  .encart {{ grid-template-columns: 1fr; }}
  .intro-section {{ margin-left: 0; }}
  textarea {{ width: 100%; margin-left: 0; }}
}}
@page {{ size: A4; margin: 14mm 12mm; }}
@media print {{
  body {{ background: #fff; font-size: 12px; }}
  .outils {{ display: none; }}
  header.bandeau {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  header.bandeau .page {{ padding-top: 18px; padding-bottom: 18px; }}
  .section, .encart div {{ border-color: #ddd; box-shadow: none; }}
  .section {{ padding: 14px 18px; margin-top: 12px; }}
  .q {{ padding: 7px 0; }}
  .num, .bloquant, footer {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  textarea {{ border: 0; border-bottom: 1px dotted #999; border-radius: 0; background: transparent; resize: none; min-height: 22px; padding: 2px 0; }}
  textarea::placeholder {{ color: transparent; }}
  textarea[rows="3"] {{ min-height: 54px; background-image: repeating-linear-gradient(transparent, transparent 17px, #ccc 17px, #ccc 18px); border-bottom: 0; }}
  .page {{ max-width: none; padding: 0; }}
}}
</style>
</head>
<body>
<header class="bandeau">
  <div class="page">
    <img src="data:image/jpeg;base64,{badge64}" alt="Logo French Tacos">
    <div>
      <h1 class="titre">Votre site de commande <span>French Tacos</span></h1>
      <p>Pour mettre le site en ligne, nous avons besoin des informations ci-dessous. Le site fonctionne déjà avec votre carte : chaque réponse remplace simplement une valeur provisoire.</p>
    </div>
  </div>
</header>

<div class="outils">
  <div class="page">
    <div class="progression"><small id="texte-progression">0 point traité</small><div class="barre"><span id="barre"></span></div></div>
    <button type="button" class="secondaire" id="effacer">Tout effacer</button>
    <button type="button" class="principal" id="imprimer">Imprimer ou enregistrer en PDF</button>
  </div>
</div>

<main class="page">
  <div class="encart">
    <div><h3>Déjà prêt</h3><p>Carte complète avec composition des tacos, panier, livraison et retrait, paiement par carte, Apple Pay et Google Pay, suivi de commande en direct, écran cuisine pour l'équipe.</p></div>
    <div><h3>Comment répondre</h3><p>Cochez chaque point traité et notez vos réponses. Les points <span class="bloquant">Bloquant</span> sont indispensables avant l'ouverture. Joignez à votre envoi le logo, les photos et le tableau des allergènes.</p></div>
  </div>

  {"".join(blocs)}

  <footer>
    <strong>Merci !</strong> Renvoyez ce document complété (ou son PDF) en un seul envoi, avec les fichiers du logo, les photos et le tableau des allergènes. Nous revenons vers vous avec une date de recette.
  </footer>
  <p class="date">Document du 20 octobre 2026.</p>
</main>

<script>
(function () {{
  var CLE = "french-tacos-questionnaire";
  var champs = document.querySelectorAll("[data-cle]");
  var cases = document.querySelectorAll('input[type="checkbox"][data-cle]');
  function lire() {{ try {{ return JSON.parse(localStorage.getItem(CLE) || "{{}}"); }} catch (e) {{ return {{}}; }} }}
  function ecrire(d) {{ try {{ localStorage.setItem(CLE, JSON.stringify(d)); }} catch (e) {{}} }}
  function progression() {{
    var faits = 0;
    cases.forEach(function (c) {{ if (c.checked) faits++; }});
    document.getElementById("barre").style.width = (faits / cases.length * 100) + "%";
    document.getElementById("texte-progression").textContent = faits + " point" + (faits > 1 ? "s" : "") + " traité" + (faits > 1 ? "s" : "") + " sur " + cases.length;
  }}
  function ajuster(t) {{ t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px"; }}
  var donnees = lire();
  champs.forEach(function (el) {{
    var cle = el.getAttribute("data-cle");
    if (el.type === "checkbox") el.checked = Boolean(donnees[cle]); else if (donnees[cle]) el.value = donnees[cle];
    el.addEventListener(el.type === "checkbox" ? "change" : "input", function () {{
      var d = lire(); d[cle] = el.type === "checkbox" ? el.checked : el.value; ecrire(d);
      if (el.tagName === "TEXTAREA") ajuster(el);
      progression();
    }});
    if (el.tagName === "TEXTAREA" && el.value) ajuster(el);
  }});
  document.getElementById("imprimer").addEventListener("click", function () {{ window.print(); }});
  document.getElementById("effacer").addEventListener("click", function () {{
    if (!confirm("Effacer toutes les réponses de ce document ?")) return;
    ecrire({{}}); champs.forEach(function (el) {{ if (el.type === "checkbox") el.checked = false; else el.value = ""; }}); progression();
  }});
  progression();
}})();
</script>
</body>
</html>
"""

sortie = REPO / "docs" / "questionnaire-client.html"
sortie.write_text(page, encoding="utf-8")
print(f"{compteur} questions -> {sortie}")
