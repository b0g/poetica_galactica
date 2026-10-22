# Poetica Galactica — V1

Site personnel de poésie. Pur HTML/CSS/JS, **aucune dépendance**, aucun build.

## Ouvrir

Double-clic sur `index.html` (fonctionne aussi en `file://`), ou en local :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Fichiers

```
V1/
├── index.html
└── assets/
    ├── css/style.css
    ├── img/papier.webp  ← texture papier (motif précalculé, voir plus bas)
    └── js/
        ├── poemes.js   ← contenu (poèmes, écritures, contact)
        ├── galaxy.js   ← fond étoilé (canvas 2D, variante « Nuée organique »)
        └── app.js      ← feuilles, lecture plein écran, machine à écrire
```

## Ce que ça fait

- **Fond étoilé** : un `<canvas>` 2D. Un champ de flux lisse (bruit de valeur maison) fait dériver ~900 points colorés, avec des traînées douces. Le curseur crée un léger tourbillon qui contourne les points au lieu de les aspirer. Gèle automatiquement si l'utilisateur a activé « réduire les animations ».
  - Source : variante **01 « Nuée organique »** de `../../galaxy_background/01_nuee_organique/` (fond choisie par B. le 2026-10-14).
- **Constellation** : chaque poème est une feuille de papier légèrement transparente (opacité 0,8) qui flotte dans l'espace, avec un effet 3D (`perspective` + `translate3d`, parallaxe selon la profondeur). Aucune librairie.
- **Lecture plein écran** : clic sur une feuille → le poème s'agrandit (animation FLIP), les autres s'estompent, la feuille vire au blanc franc pour la lisibilité. Fermeture par la croix en bas, un clic à côté, ou `Échap`. Au retour, les autres feuilles **réapparaissent en cascade** (ordre aléatoire, ~200 ms d'écart, léger jitter) au lieu de revenir d'un bloc ; dans `app.js`, `retourEnCascade()` pose un `--retour` par feuille et un seul minuteur de nettoyage (voir aussi `prefers-reduced-motion`).
- **Menu machine à écrire** (bas à gauche, flat bleu) : clic → une page sort de la machine et **s'écrit lettre à lettre** : les prochaines écritures, puis la fiche de contact. Fermeture par re-clic, clic ailleurs, ou `Échap`.
- **Typographie** : une seule police pour tout le site, machine à écrire (`Courier Prime` si présent, sinon `Courier New` / `Nimbus Mono PS` / `Liberation Mono` / monospace).
- **Texture papier** : toutes les surfaces de papier (vignettes flottantes, poème ouvert, page de la machine à écrire) reçoivent un léger relief de feuille froissée. C'est **une image** — `assets/img/papier.webp`, 768 × 768, 31 Ko — posée en `background-blend-mode: multiply` par `.papier, .page-machine`. Zéro dépendance, et le site s'ouvre toujours en double-clic depuis `file://`.
  - Pourquoi une image et non un filtre SVG : le même motif écrit en filtre SVG inline (`feTurbulence` + `feDiffuseLighting` + `feBlend`) coûtait **~4,8 s par clic dans Firefox**, contre 0,6 s sans texture. Une image n'est calculée qu'une fois, le rendu redevient celui du témoin sans texture (voir « Régénérer la texture »).
  - Chaque vignette décale le motif (`background-position: var(--papier-x) var(--papier-y)`, posé par `app.js`, taille de tuile `--papier-tuile`) : sans ça, les 7 feuilles afficheraient le même coin de papier.
  - **Pour doser** : changer l'image (recette ci-dessous). Pour l'enlever entièrement sans toucher au reste : `--papier-url: none` dans `:root`.

## Modifier le contenu

Tout le texte est dans `assets/js/poemes.js` :

- `window.POEMES` — les poèmes (texte + place dans la galaxie : `x`, `y`, `z`, `ry`, `rz`, `w`).
- `window.ECRITURES` — les événements.
- `window.CONTACT` — email et zone.

C'est **le** fichier à toucher pour la démo de mise à jour (ajouter un poème, ajouter une écriture, changer un texte).

## Accessibilité / robustesse

- Navigation clavier : `Tab` jusqu'à une feuille, `Entrée` ou `Espace` pour ouvrir, `Échap` pour fermer.
- `prefers-reduced-motion` respecté (pas de flottement, fond figé, texte affiché d'un coup).
- Responsive : sous 860 px, la constellation devient une colonne scrollable.

## Notes

- Contenu volontairement un peu daté (les trois écritures sont passées) pour la démo de mise à jour de la vidéo.
- Textes des poèmes repris **tels quels** depuis `contenu/poemes/` (fautes et incertitudes de dictée conservées).
- Si ça rame sur une machine modeste, les premiers leviers sont : le nombre de particules (`REGLAGES.particules` dans `galaxy.js`), le `backdrop-filter` des feuilles (le retirer), la texture papier (`--papier-url: none`), le décalage par vignette (`--papier-x`), et le fondu de traînée (`REGLAGES.fondu`).

## Régénérer la texture

`assets/img/papier.webp` est produite hors du site, une fois pour toutes. Le motif
est un froissé de deux échelles, éclairées séparément puis multipliées, plus une
trame de grain. Deux points à respecter si on la refait :

- `feDiffuseLighting` lit la carte de hauteur dans le **canal alpha**. Empiler
  deux bruits avant l'éclairage ne marche pas : combiner deux images opaques
  force l'alpha à 1 et l'on obtient une feuille parfaitement plate. Il faut
  éclairer chaque bruit séparément, puis multiplier les deux reliefs.
- `numOctaves` fait la densité du maillage : à `baseFrequency 0.045` avec
  4 octaves, la fréquence la plus haute passe sous le pixel et la texture
  devient un grillage régulier.

Source du motif (à ouvrir dans un navigateur, puis capturer le `<rect>` en
768 × 768, par exemple via `canvas.toDataURL`, puis convertir en WebP) :

```html
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768">
  <filter id="f" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="turbulence" baseFrequency="0.030" numOctaves="4" seed="5" result="n1"/>
    <feDiffuseLighting in="n1" surfaceScale="2.4" diffuseConstant="1" result="l1">
      <feDistantLight azimuth="235" elevation="60"/>
    </feDiffuseLighting>
    <feTurbulence type="turbulence" baseFrequency="0.009" numOctaves="2" seed="17" result="n2"/>
    <feDiffuseLighting in="n2" surfaceScale="3.4" diffuseConstant="1" result="l2">
      <feDistantLight azimuth="235" elevation="60"/>
    </feDiffuseLighting>
    <feBlend in="l1" in2="l2" mode="multiply"/>
    <feComponentTransfer>
      <feFuncR type="linear" slope="0.30" intercept="0.70"/>
      <feFuncG type="linear" slope="0.30" intercept="0.70"/>
      <feFuncB type="linear" slope="0.30" intercept="0.70"/>
    </feComponentTransfer>
  </filter>
  <rect width="768" height="768" filter="url(#f)"/>
</svg>
```

Puis multiplier la trame de grain par-dessus (même fichier, tuile de 220 px) :

```html
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
  <filter id="g">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncR type="linear" slope="0.05" intercept="0.975"/>
      <feFuncG type="linear" slope="0.05" intercept="0.975"/>
      <feFuncB type="linear" slope="0.05" intercept="0.975"/>
    </feComponentTransfer>
  </filter>
  <rect width="220" height="220" filter="url(#g)"/>
</svg>
```

Le grain doit rester **désaturé** (`saturate 0`) pour ne pas teinter la feuille.
La couture de la tuile est invisible (mesuré : ±1 de luminance sur une variation
normale de ±18).

Réglages : `slope` / `intercept` des `feFuncR/G/B` dosent la force (`0.30` /
`0.70` aujourd'hui ; `0.16` / `0.84` pour un grain à peine perceptible).
`baseFrequency` règle la taille des plis, `numOctaves` leur finesse.
