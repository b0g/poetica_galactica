/* ============================================================
   Poetica Galactica — données des poèmes (V1)
   Texte copié tel quel depuis contenu/poemes/ (fidélité à la source :
   fautes de frappe et incertitudes de dictée conservées).
   Chaque poème porte aussi sa place dans la galaxie :
     x, y  : position du centre, en % du cadre
     z     : profondeur en px (effet 3D)
     ry,rz : rotations légères (deg)
     w     : largeur de la feuille (px)
   ============================================================ */

window.POEMES = [
  {
    id: "etoiles",
    titre: "À quoi pensent les étoiles ?",
    date: "1er novembre 2025",
    source: "machine à écrire",
    x: 24, y: 22, z: 40, ry: -7, rz: -1.5, w: 330,
    texte:
`A quoi pensent les étoiles ?
Connaissent t-elles les couchers de soleil ?
Est-ce qu'elles se demandent quel temps il a fait hier ?
Peut être qu'elles ont peur du noir

Elles te regardent
Froncer le front de tes humeurs
Elles te regardent
T'agiter pour du vent
Elles te regardent
Nager dans ton bol de contentement
Flotter a la surface de ton interieur
Parler comme un rocher du dedans
Et parfois, le courage d'une paquerette`
  },
  {
    id: "pluie",
    titre: "À quelle allure tombe la pluie ?",
    date: "30 octobre 2025",
    source: "machine à écrire",
    x: 56, y: 13, z: 120, ry: 6, rz: 1, w: 345,
    texte:
`A quelle allure tombe la pluie ?

A la vitesse de ta voix, qui regrette le soleil
Rapide comme la caresse, d'un chat sur un tapis
Avec l'élan des bon jours, chauds sans veste

Écoute
Ca frappe les tuiles avec du temps
Écoute
Tu la sens couler dans tes bottes
Écoute

Rien n'a besoin de te proteger
Écoute
La chaleur viens du mouvement

Et tu ne saurait pas a quelle vitesse
Le sable s'écoulerait trop len te ment . . .
Et tout n'irait pas si vite
Sous ton regard brillant`
  },
  {
    id: "brumes",
    titre: "Brumes et matins",
    date: "10 octobre 2026",
    source: "dictée — titre provisoire",
    x: 84, y: 25, z: 60, ry: -5, rz: 2, w: 255,
    texte:
`Brumes et matins dans un muscle froissé,
Buffle en patin et musque osé,
Le sol attend que je sorte le tambouriné de mes pieds,
Doucement.
Je te rejoins, animale ou anifemelle,
ani kouni je sors du lit.`
  },
  {
    id: "pierres",
    titre: "De quoi parlent les pierres ?",
    date: "",
    source: "machine à écrire",
    x: 40, y: 50, z: 150, ry: 4, rz: -1, w: 325,
    texte:
`De quoi parlent les pierres ?

Sans yeux surement pas de la pluie ni du beau temps
Sans main ni vetements pas de la temperature non plus
Sans battements
        peuvent'elles parler d'amour ?
A mon avis, ellesne parlent pas, Elles CRIENT
ELLES CRIENT, parce que le sol bouge trop
ELLES CRIENT, carx les oiseaux sont trop loin
ELLES CRIENT, car elles n'arrivent pas a se toucher
Parfois si laisse le silence t'habiter,
        tu pourrais les entendre chanter
Mais c'est la l'exeption, caché dans un paradoxe
Existe, doux et plaintif
le chant des ...`
  },
  {
    id: "attends",
    titre: "Attends",
    date: "",
    source: "machine à écrire",
    x: 73, y: 50, z: 30, ry: -6, rz: 2.5, w: 265,
    texte:
`Attends

Attends, Jacque le fourbe
un haricot plat, un son de tôle

Attends, un beau jour, un autre
des nouvelles chansons, le orange

Attends, le retour du soleil

Attends, la porte grince
Attends, les cloches sonnent, un chien
dépourvu, l'herbe fraîche

Attends, la retenue t'étouffe, un nénuphar

Attends, l'enfance retrouvée

Attends, l'amour passé, le pire souvenir,
un frisson, un seau de glaçon,
respirer la montagne

Attends, au revoir

Attends
bonjour

Attends
mon amour
la salade verte
huile de toi

Attends
au revoir

Atten,s`
  },
  {
    id: "bras",
    titre: "À bras le corps",
    date: "10 octobre 2026",
    source: "dictée",
    x: 22, y: 78, z: 80, ry: 7, rz: 2, w: 275,
    texte:
`A bras le corps, titre de la sculpture,
dont la vue me transporte vers une porte de l'esprit.
Elle a la douceur du romantisme,
un bronze un peu patiné,
une envie de créer.
Des corps qui s'enlacent,
solides comme du métal,
une forte intensité et beaucoup d'amour,
bonne journée`
  },
  {
    id: "sans",
    titre: "Sans penser à rien",
    date: "10 octobre 2026",
    source: "dictée — titre provisoire",
    x: 58, y: 80, z: 50, ry: -6, rz: -2.5, w: 300,
    texte:
`Sans penser a rien, m'avale l'air du matin.
Les tumultes de la nuit ont pris fin dans un bruit.
J'aime emmener quelques mots, sortis de mon repos, en imaginant tes yeux pétillants, malicieux, et un peu bleu.
Il y a plein de poésie dispersée au pied de mon lit.
Entouré comme ça d'amour, mes matins ne sont jamais gris.`
  }
];

/* ============================================================
   Écritures (événements) : CONTENU FICTIF pour la V1.
   Deux passées, une à venir (voir contenu/ecritures.md).
   ============================================================ */

window.ECRITURES = [
  /* lat / lng servent uniquement à la carte (créée en direct dans la vidéo),
     ils ne s'affichent pas dans le menu machine à écrire. */
  { titre: "Haïkus au potager", lieu: "Le Château de la Tomate, La Roche-sur-Yon", quand: "sam. 20 sept. 2026", lat: 46.6705, lng: -1.4269 },
  { titre: "Nuit blanche dans les nuages", lieu: "L'Observatoire des Nuages, Pic du Midi de Bigorre", quand: "dim. 4 oct. 2026", lat: 42.9369, lng: 0.1422 },
  { titre: "Les mots suivent la rivière", lieu: "La Rivière de l'Amitié : les Gorges du Fier, Annecy", quand: "sam. 14 nov. 2026", lat: 45.9017, lng: 6.0969 }
];

window.CONTACT = {
  email: "poetica@paradize.fr",
  zone: "Quelque part sous de beaux nuages"
};
