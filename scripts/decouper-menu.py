"""Découpe les visuels PROVISOIRES du site à partir des affiches du restaurant.

Les photos définitives (shooting ou fichiers HD du client) remplaceront ces
images : il suffit de déposer un fichier du même nom dans public/images/.

Usage : python scripts/decouper-menu.py
"""

from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

RACINE = Path(__file__).resolve().parent.parent
SOURCES = RACINE / "docs" / "sources"
SORTIE = RACINE / "public" / "images"

AFFICHES = {
    "ancienne": "menu-affiche.jpg",  # seule source de photos de tacos
    "sandwich": "carte-sandwich.jpg",
    "tacos": "carte-tacos.jpg",
    "kapsalon": "carte-kapsalon-panini-texmex.jpg",
    "burgers": "carte-burgers-enfants-boissons-desserts.jpg",
}

# nom : (affiche, (x0, y0, x1, y1)) en pixels de l'affiche
PRODUITS = {
    "tacos-simple": ("ancienne", (418, 251, 499, 322)),
    "tacos-double": ("ancienne", (513, 251, 599, 322)),
    "tacos-maxi": ("ancienne", (613, 251, 699, 322)),
    "sandwich-cordon-bleu": ("sandwich", (105, 185, 340, 318)),
    "sandwich-mistral": ("sandwich", (468, 195, 748, 345)),
    "sandwich-extreme": ("sandwich", (890, 192, 1162, 342)),
    "sandwich-radical": ("sandwich", (1283, 182, 1527, 318)),
    "burger-cheese": ("burgers", (32, 188, 242, 306)),
    "burger-double-cheese": ("burgers", (283, 203, 497, 360)),
    "burger-triple-cheese": ("burgers", (538, 243, 762, 436)),
    "burger-supreme": ("burgers", (843, 243, 1077, 436)),
    "burger-baps": ("burgers", (1108, 198, 1317, 365)),
    "burger-chicken": ("burgers", (1358, 148, 1547, 292)),
    "formule-menu": ("burgers", (543, 53, 677, 172)),
    "pain-naan-burger": ("burgers", (868, 88, 1022, 176)),
    "kapsalon": ("kapsalon", (247, 256, 452, 345)),
    "assiette": ("kapsalon", (178, 652, 400, 825)),
    "panini": ("kapsalon", (1040, 290, 1305, 351)),
    "texmex-tenders": ("kapsalon", (718, 548, 817, 632)),
    "texmex-wings": ("kapsalon", (898, 548, 985, 625)),
    "texmex-nuggets": ("kapsalon", (1053, 553, 1197, 632)),
    "texmex-mozza-sticks": ("kapsalon", (1238, 553, 1327, 632)),
    "texmex-camembert": ("kapsalon", (1383, 558, 1477, 627)),
    "frites-cheddar": ("kapsalon", (693, 703, 862, 792)),
    "frites": ("kapsalon", (913, 703, 1082, 792)),
    "frites-lardon": ("kapsalon", (1143, 703, 1317, 792)),
    "barquette-kebab": ("kapsalon", (1363, 703, 1532, 792)),
    "menu-enfant": ("burgers", (13, 663, 207, 802)),
    "boisson-cafe": ("burgers", (618, 742, 707, 802)),
    "boisson-canette": ("burgers", (743, 703, 852, 797)),
    "boisson-bouteille": ("burgers", (893, 688, 987, 802)),
    "dessert-tarte-daim": ("burgers", (1168, 658, 1267, 732)),
    "dessert-tiramisu": ("burgers", (1393, 638, 1477, 712)),
    "dessert-panini-nutella": ("burgers", (1083, 773, 1192, 842)),
    "dessert-naan-nutella": ("burgers", (1268, 748, 1387, 837)),
    "dessert-naan-miel": ("burgers", (1415, 760, 1507, 837)),
}

# Bandeaux de catégorie (larges)
BANNIERES = {
    "banniere-tacos": ("ancienne", (318, 44, 716, 213)),
    "banniere-sandwichs": ("sandwich", (468, 190, 1162, 345)),
    "banniere-burgers": ("burgers", (538, 200, 1320, 440)),
    "banniere-kapsalon": ("kapsalon", (247, 256, 452, 345)),
    "banniere-assiettes": ("kapsalon", (178, 652, 400, 825)),
    "banniere-texmex": ("kapsalon", (693, 545, 1532, 795)),
}

# Vignettes des choix (pains, viandes, suppléments, gratinés, sauces)
CHOIX = {
    "pain-maison": ("sandwich", (1068, 68, 1177, 142)),
    "pain-galette": ("sandwich", (1198, 68, 1302, 142)),
    "pain-cheese-naan": ("sandwich", (1328, 53, 1437, 142)),
    "viande-kebab": ("sandwich", (8, 523, 127, 632)),
    "viande-steak": ("sandwich", (123, 528, 242, 627)),
    "viande-poulet": ("sandwich", (233, 528, 337, 627)),
    "viande-falafel": ("sandwich", (333, 523, 442, 627)),
    "viande-tenders": ("sandwich", (438, 523, 552, 627)),
    "viande-nuggets": ("sandwich", (548, 528, 647, 627)),
    "viande-cordon-bleu": ("sandwich", (643, 528, 747, 627)),
    "viande-merguez": ("sandwich", (743, 528, 847, 627)),
    "viande-farmer": ("sandwich", (838, 538, 982, 627)),
    "sup-boursin": ("sandwich", (103, 763, 187, 842)),
    "sup-bonne-vache": ("sandwich", (228, 773, 302, 842)),
    "sup-chevre": ("sandwich", (338, 773, 422, 837)),
    "sup-cheddar": ("sandwich", (453, 768, 542, 837)),
    "sup-oeuf": ("sandwich", (553, 778, 637, 842)),
    "sup-raclette": ("sandwich", (663, 768, 747, 842)),
    "sup-lardon": ("sandwich", (778, 778, 845, 842)),
    "gratine-cheddar": ("tacos", (1023, 493, 1202, 627)),
    "gratine-raclette": ("tacos", (1208, 493, 1397, 627)),
    "gratine-chevre-miel": ("tacos", (1398, 493, 1582, 627)),
    "gratine-lardon": ("tacos", (1018, 673, 1197, 807)),
    "gratine-bacon": ("tacos", (1208, 673, 1397, 807)),
    "gratine-poivron": ("tacos", (1408, 673, 1597, 807)),
    "sauce-blanche": ("sandwich", (1168, 573, 1232, 637)),
    "sauce-mayonnaise": ("sandwich", (1268, 573, 1332, 637)),
    "sauce-ketchup": ("sandwich", (1368, 573, 1432, 637)),
    "sauce-moutarde": ("sandwich", (1468, 573, 1532, 637)),
    "sauce-algerienne": ("sandwich", (1168, 653, 1232, 717)),
    "sauce-barbecue": ("sandwich", (1268, 653, 1332, 717)),
    "sauce-harissa": ("sandwich", (1368, 653, 1432, 717)),
    "sauce-andalouse": ("sandwich", (1468, 653, 1532, 717)),
    "sauce-samourai": ("sandwich", (1168, 733, 1232, 797)),
    "sauce-marocaine": ("sandwich", (1268, 733, 1332, 797)),
    "sauce-bresilienne": ("sandwich", (1368, 733, 1432, 797)),
    "sauce-biggy": ("sandwich", (1468, 733, 1532, 797)),
    "sauce-chili-thai": ("sandwich", (1222, 810, 1287, 876)),
    "sauce-curry": ("sandwich", (1317, 810, 1382, 876)),
    "sauce-cheesy-easy": ("sandwich", (1412, 810, 1477, 876)),
}

FOND = (253, 251, 248)


def carre(img: Image.Image, cote: int) -> Image.Image:
    """Centre l'image sur un fond clair carré puis l'agrandit proprement."""
    largeur, hauteur = img.size
    taille = max(largeur, hauteur)
    toile = Image.new("RGB", (taille, taille), FOND)
    toile.paste(img, ((taille - largeur) // 2, (taille - hauteur) // 2))
    return toile.resize((cote, cote), Image.Resampling.LANCZOS)


def ameliorer(img: Image.Image) -> Image.Image:
    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    return ImageOps.autocontrast(img, cutoff=0.5)


def enregistrer(img: Image.Image, chemin: Path, qualite: int = 84) -> None:
    chemin.parent.mkdir(parents=True, exist_ok=True)
    img.save(chemin, "WEBP", quality=qualite, method=6)


def main() -> None:
    affiches = {nom: Image.open(SOURCES / fichier).convert("RGB") for nom, fichier in AFFICHES.items()}

    for nom, (affiche, boite) in PRODUITS.items():
        enregistrer(ameliorer(carre(affiches[affiche].crop(boite), 360)), SORTIE / "menu" / f"{nom}.webp")

    for nom, (affiche, boite) in BANNIERES.items():
        morceau = affiches[affiche].crop(boite)
        largeur = 960
        hauteur = round(morceau.height * largeur / morceau.width)
        img = ameliorer(morceau.resize((largeur, hauteur), Image.Resampling.LANCZOS))
        enregistrer(img, SORTIE / "menu" / f"{nom}.webp", 80)

    for nom, (affiche, boite) in CHOIX.items():
        enregistrer(ameliorer(carre(affiches[affiche].crop(boite), 128)), SORTIE / "choix" / f"{nom}.webp", 82)

    # Enseigne lumineuse : visuel de marque (héros, partage réseaux sociaux)
    enseigne = Image.open(SOURCES / "enseigne.jpg").convert("RGB")
    enregistrer(enseigne.resize((900, 904), Image.Resampling.LANCZOS), SORTIE / "marque" / "enseigne.webp", 86)
    badge = enseigne.crop((160, 105, 800, 745)).resize((512, 512), Image.Resampling.LANCZOS)
    enregistrer(badge, SORTIE / "marque" / "badge.webp", 88)
    partage = Image.new("RGB", (1200, 630), (18, 10, 6))
    centre = enseigne.crop((60, 60, 885, 885)).resize((630, 630), Image.Resampling.LANCZOS)
    partage.paste(centre, (285, 0))
    partage.save(SORTIE / "marque" / "partage.jpg", "JPEG", quality=86, optimize=True)

    print(f"{len(PRODUITS)} produits, {len(BANNIERES)} bannières, {len(CHOIX)} choix générés.")


if __name__ == "__main__":
    main()
