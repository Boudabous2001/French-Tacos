"""Découpe les visuels PROVISOIRES du site à partir de l'affiche menu du client.

Les photos définitives (shooting ou fichiers HD du client) remplaceront ces
images : il suffit de déposer un fichier du même nom dans public/images/.

Usage : python scripts/decouper-menu.py
"""

from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

RACINE = Path(__file__).resolve().parent.parent
AFFICHE = RACINE / "docs" / "sources" / "menu-affiche.jpg"
ENSEIGNE = RACINE / "docs" / "sources" / "enseigne.jpg"
SORTIE = RACINE / "public" / "images"

# (nom, (x0, y0, x1, y1)) en pixels de l'affiche 1448 x 1086
PRODUITS = {
    # Tacos
    "tacos-simple": (418, 251, 499, 322),
    "tacos-double": (513, 251, 599, 322),
    "tacos-triple": (613, 251, 699, 322),
    # Burgers
    "burger-cheese": (744, 236, 848, 322),
    "burger-bacon": (854, 236, 961, 322),
    "burger-chicken": (967, 236, 1073, 322),
    "burger-big": (1079, 236, 1183, 322),
    "burger-raclette": (1194, 236, 1303, 322),
    "burger-chevre": (1309, 236, 1418, 322),
    # Sandwichs
    "sandwich-kebab": (40, 695, 130, 733),
    "sandwich-poulet": (40, 735, 130, 772),
    "sandwich-steak": (40, 772, 130, 811),
    "sandwich-merguez": (40, 812, 130, 852),
    "sandwich-tenders": (360, 692, 447, 733),
    "sandwich-cordon-bleu": (360, 732, 447, 772),
    "sandwich-kefta": (360, 770, 447, 811),
    "sandwich-falafel": (360, 810, 447, 852),
    # Paninis / galettes (un visuel par famille)
    "panini": (26, 914, 158, 1020),
    "galette": (360, 917, 502, 1030),
    # Assiettes
    "assiette-kebab": (753, 627, 876, 705),
    "assiette-poulet": (881, 612, 1011, 705),
    "assiette-steak": (1017, 612, 1148, 705),
    "assiette-merguez": (1154, 612, 1283, 705),
    "assiette-kefta": (1289, 612, 1421, 705),
    # Tex-Mex
    "texmex-nuggets": (897, 776, 978, 825),
    "texmex-tenders": (992, 776, 1071, 825),
    "texmex-onion-rings": (1074, 774, 1240, 825),
    "texmex-mozza-sticks": (1236, 776, 1310, 825),
    "texmex-jalapenos": (1327, 776, 1413, 825),
    # Menu enfant, boissons, desserts
    "menu-enfant": (812, 944, 896, 1030),
    "boissons": (964, 931, 1109, 1023),
    "dessert-tarte-daim": (1229, 926, 1299, 970),
    "dessert-tiramisu": (1349, 903, 1390, 963),
    "dessert-muffin": (1237, 976, 1301, 1033),
    "dessert-donut": (1343, 968, 1392, 1036),
    # Visuel « menu burger + frites + boisson »
    "formule-menu": (746, 434, 898, 534),
}

# Grandes bannières de catégorie
BANNIERES = {
    "banniere-tacos": (318, 44, 716, 213),
    "banniere-burgers": (1133, 41, 1427, 206),
    "banniere-sandwichs": (436, 554, 712, 686),
    "banniere-assiettes": (747, 612, 1148, 705),
}

# Vignettes des choix (viandes, suppléments, sauces)
CHOIX = {
    "viande-kebab": (35, 243, 119, 299),
    "viande-poulet": (128, 243, 212, 299),
    "viande-steak": (225, 243, 302, 299),
    "viande-tenders": (310, 243, 402, 299),
    "viande-merguez": (33, 325, 119, 379),
    "viande-cordon-bleu": (130, 325, 214, 379),
    "viande-falafel": (225, 325, 304, 379),
    "viande-kefta": (318, 325, 397, 379),
    "sup-bacon": (38, 450, 92, 494),
    "sup-jambon": (95, 450, 147, 494),
    "sup-raclette": (148, 450, 199, 494),
    "sup-cheddar": (207, 450, 252, 494),
    "sup-chevre": (259, 450, 304, 494),
    "sup-oeuf": (308, 450, 359, 494),
    "sup-oignons": (360, 450, 409, 494),
    "sup-jalapenos": (418, 450, 469, 494),
    "sauce-algerienne": (500, 438, 537, 469),
    "sauce-blanche": (553, 438, 592, 469),
    "sauce-barbecue": (605, 438, 642, 469),
    "sauce-harissa": (658, 438, 695, 469),
    "sauce-curry": (500, 482, 537, 513),
    "sauce-samourai": (553, 482, 592, 513),
    "sauce-ketchup": (605, 482, 642, 513),
    "sauce-mayonnaise": (658, 482, 695, 513),
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
    affiche = Image.open(AFFICHE).convert("RGB")

    for nom, boite in PRODUITS.items():
        img = ameliorer(carre(affiche.crop(boite), 360))
        enregistrer(img, SORTIE / "menu" / f"{nom}.webp")

    for nom, boite in BANNIERES.items():
        morceau = affiche.crop(boite)
        largeur = 960
        hauteur = round(morceau.height * largeur / morceau.width)
        img = ameliorer(morceau.resize((largeur, hauteur), Image.Resampling.LANCZOS))
        enregistrer(img, SORTIE / "menu" / f"{nom}.webp", 80)

    for nom, boite in CHOIX.items():
        img = ameliorer(carre(affiche.crop(boite), 128))
        enregistrer(img, SORTIE / "choix" / f"{nom}.webp", 82)

    # Enseigne lumineuse : visuel de marque (héros, partage réseaux sociaux)
    enseigne = Image.open(ENSEIGNE).convert("RGB")
    enregistrer(enseigne.resize((900, 904), Image.Resampling.LANCZOS), SORTIE / "marque" / "enseigne.webp", 86)
    badge = enseigne.crop((160, 105, 800, 745)).resize((512, 512), Image.Resampling.LANCZOS)
    enregistrer(badge, SORTIE / "marque" / "badge.webp", 88)
    # Image de partage 1200 x 630 : l'enseigne centrée sur fond nuit
    partage = Image.new("RGB", (1200, 630), (18, 10, 6))
    centre = enseigne.crop((60, 60, 885, 885)).resize((630, 630), Image.Resampling.LANCZOS)
    partage.paste(centre, (285, 0))
    partage.save(SORTIE / "marque" / "partage.jpg", "JPEG", quality=86, optimize=True)

    print(f"{len(PRODUITS)} produits, {len(BANNIERES)} bannières, {len(CHOIX)} choix générés.")


if __name__ == "__main__":
    main()
