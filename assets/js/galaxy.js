/* ============================================================
   Poetica Galactica, fond de la page
   Variante retenue : « NUEÉ ORGANIQUE » (galaxy_background/01_nuee_organique)
   Recopiée telle quelle depuis la démo validée.
   Aucune dépendance. Voir galaxy_background/README.md
   ============================================================ */
/* ============================================================
   NUÉE ORGANIQUE, fond étoilé pour Poetica Galactica
   Version : variante 01
   Aucune dépendance, aucun build, aucun module ES, aucun fetch.

   Principe
   ---------
   Un seul <canvas id="galaxie">. Un seul requestAnimationFrame.
   Un champ de flux (flow field) lisse fait dériver des centaines
   de petits points colorés, comme un banc de plancton. Le curseur
   crée un léger tourbillon (vortex) qui contourne les points au
   lieu de les aspirer brutalement. Un voile noir très peu opaque
   est appliqué à chaque frame : au lieu d'effacer, il laisse des
   traînées douces.

   Aucune écriture DOM dans la boucle, aucun objet alloué par frame.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('galaxie');
  if (!canvas) { return; }
  var ctx = canvas.getContext('2d');
  if (!ctx) { return; }

  /* ------------------------------------------------------------
     RÉGLAGES EXPOSÉS (tout se règle ici)
     ------------------------------------------------------------ */
  var REGLAGES = {
    particules:    900,    // nombre de points de la nuée à 1440x900 (adapté ensuite)
    fondu:         0.06,   // opacité du voile de traînée par frame (0.02 = long, 0.12 = court)
    nettoyage:     900,    // nettoyage doux tous les N frames (sécurité)
    nettoyageFonc: 0.25,   // force de ce nettoyage doux
    flux:          45,     // force du champ de flux en px/s² (drift lent)
    amorti:        0.955,  // frottement par frame à 60 fps (0.9 = lourd, 0.99 = glissant)
    vitesseMax:    95,     // vitesse maximale en px/s (garde-fou et douceur)
    cellules:      74,     // taille d'une cellule du flow field en px (grand = fluide)
    rayonCurseur:  220,    // rayon d'influence du curseur en px
    forceCurseur:  170,    // force du tourbillon en px/s² (monter = plus vif)
    aspirer:       0.20,   // part radiale du vortex (0 = tourbillon pur, 1 = aspire)
    noyau:         34,     // rayon du noyau répulsif autour du curseur en px
    lerpCurseur:   0.10,   // lissage du suivi du curseur (0.05 = lent, 0.2 = vif)
    parallaxe:     [0.006, 0.013, 0.022], // amplitude de parallaxe par couche d'étoiles
    cellulesEtoiles: [9e-5, 5e-5, 2e-5]   // densité d'étoiles de fond par couche (par px²)
  };

  /* ------------------------------------------------------------
     PALETTE (celle du pen) + quelques points presque blancs
     ------------------------------------------------------------ */
  var PALETTE = ['#0A4247', '#8C2F0D', '#F2A057', '#F2C185', '#8CB7B8'];
  var PRESQUE_BLANC = '#FBF7EE';
  var COULEURS = PALETTE.concat([PRESQUE_BLANC]);
  /* Poids : les teintes sombres servent de profondeur, les claires de nuée. */
  var POIDS = [0.07, 0.06, 0.24, 0.28, 0.27, 0.08];

  /* Niveaux d'opacité pré-cuits dans les sprites (pour ne rien recalculer). */
  var NIVEAUX_ALPHA = [0.22, 0.42, 0.66, 0.95];

  /* ------------------------------------------------------------
     SPRITES : une petite pastille douce pré-rendue par
     (couleur x niveau d'opacité). Dessiner un sprite est bien plus
     rapide que tracer un arc par particule, et le halo est plus joli.
     ------------------------------------------------------------ */
  function hexVersRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [ (n >> 16) & 255, (n >> 8) & 255, n & 255 ];
  }

  function creerSprite(hex, alpha) {
    var S = 16;
    var c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    var g = c.getContext('2d');
    var rgb = hexVersRgb(hex);
    var r = rgb[0], v = rgb[1], b = rgb[2];
    var grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0.00, 'rgba(' + r + ',' + v + ',' + b + ',' + alpha + ')');
    grad.addColorStop(0.35, 'rgba(' + r + ',' + v + ',' + b + ',' + (alpha * 0.55) + ')');
    grad.addColorStop(1.00, 'rgba(' + r + ',' + v + ',' + b + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    return c;
  }

  var SPRITES = [];
  (function () {
    for (var ci = 0; ci < COULEURS.length; ci++) {
      for (var ni = 0; ni < NIVEAUX_ALPHA.length; ni++) {
        SPRITES.push(creerSprite(COULEURS[ci], NIVEAUX_ALPHA[ni]));
      }
    }
  })();
  function indexSprite(couleur, niveau) {
    return couleur * NIVEAUX_ALPHA.length + niveau;
  }

  /* ------------------------------------------------------------
     BRUIT DE VALEUR 2D (pseudo-Perlin, sans librairie)
     Sert uniquement à construire le flow field, une fois par resize.
     ------------------------------------------------------------ */
  function hash2(ix, iy, seed) {
    var n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n = n ^ (n >>> 16);
    return (n >>> 0) / 4294967295;
  }
  function lisser(t) { return t * t * (3 - 2 * t); }
  function bruit2(x, y, seed) {
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = x - ix, fy = y - iy;
    var u = lisser(fx), v = lisser(fy);
    var a = hash2(ix,     iy,     seed);
    var b = hash2(ix + 1, iy,     seed);
    var c = hash2(ix,     iy + 1, seed);
    var d = hash2(ix + 1, iy + 1, seed);
    var haut = a + (b - a) * u;
    var bas  = c + (d - c) * u;
    return haut + (bas - haut) * v;
  }

  /* ------------------------------------------------------------
     ÉTAT GLOBAL
     ------------------------------------------------------------ */
  var w = 0, h = 0;            // dimensions logiques (px CSS)
  var dpr = 1;
  var particules = [];         // la nuée
  var couchesEtoiles = [];     // étoiles de fond (3 couches)
  var champ = null;            // flow field (grille)
  var temps = 0;               // temps cumulé en secondes
  var frames = 0;
  var raf = 0;
  var dernier = 0;

  var cx = 0, cy = 0;          // curseur lissé (vortex)
  var cibleX = 0, cibleY = 0;  // curseur brut
  var curseurActif = false;
  var influence = 0;           // 0..1, fondu du vortex

  var vmax = REGLAGES.vitesseMax;
  var vmax2 = vmax * vmax;

  /* ------------------------------------------------------------
     PRÉFÉRENCES : mouvement réduit
     ------------------------------------------------------------ */
  var mqReduit = (window.matchMedia)
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  var reduit = !!(mqReduit && mqReduit.matches);

  /* ------------------------------------------------------------
     FLOW FIELD : grille d'angles lisses, doucement animée
     ------------------------------------------------------------ */
  function construireChamp() {
    var cell = REGLAGES.cellules;
    var cols = Math.ceil(w / cell) + 2;
    var rows = Math.ceil(h / cell) + 2;
    var n = cols * rows;
    var base = new Float32Array(n);
    var amp  = new Float32Array(n);
    var ph   = new Float32Array(n);
    var anim = new Float32Array(n);
    var ech  = 0.0022;   // fréquence spatiale : petit = grandes volutes
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var k = j * cols + i;
        var x = i * cell * ech, y = j * cell * ech;
        base[k] = bruit2(x, y, 11) * Math.PI * 4;                 // direction cohérente
        amp[k]  = 0.22 + bruit2(x * 1.3, y * 1.3, 29) * 0.5;      // amplitude d'oscillation
        ph[k]   = bruit2(x, y, 47) * Math.PI * 2;                 // déphasage
      }
    }
    champ = { cols: cols, rows: rows, cell: cell, base: base, amp: amp, ph: ph, anim: anim };
  }

  function animerChamp(t) {
    var anim = champ.anim, base = champ.base, amp = champ.amp, ph = champ.ph;
    var n = anim.length, sp = t * 0.22;
    for (var i = 0; i < n; i++) {
      anim[i] = base[i] + amp[i] * Math.sin(sp + ph[i]);
    }
  }

  /* ------------------------------------------------------------
     CONSTRUCTION DE LA SCÈNE
     ------------------------------------------------------------ */
  function tirerCouleurNuée() {
    var r = Math.random(), acc = 0;
    for (var i = 0; i < POIDS.length; i++) {
      acc += POIDS[i];
      if (r <= acc) { return i; }
    }
    return COULEURS.length - 1;
  }

  function construireParticules(nb) {
    particules.length = 0;
    for (var i = 0; i < nb; i++) {
      var c = tirerCouleurNuée();
      var niveau = (Math.random() * NIVEAUX_ALPHA.length) | 0;
      var t = 2.4 + Math.random() * 3.4;           // diamètre dessiné (px)
      if (c <= 1) { t *= 0.8; }                    // teintes sombres : plus discrètes
      particules.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        t: t,
        s: indexSprite(c, niveau)
      });
    }
  }

  function construireEtoiles() {
    couchesEtoiles.length = 0;
    var aire = w * h;
    for (var ci = 0; ci < REGLAGES.cellulesEtoiles.length; ci++) {
      var nb = Math.max(8, Math.round(aire * REGLAGES.cellulesEtoiles[ci]));
      var liste = [];
      for (var i = 0; i < nb; i++) {
        // Les couches lointaines sont petites et pâles, les proches plus franches.
        var lointain = ci === 0;
        var couleur = 2 + ((Math.random() * 3) | 0);       // #F2A057, #F2C185, #8CB7B8
        if (Math.random() < 0.35) { couleur = 5; }         // presque blanc
        var niveau = lointain
          ? (Math.random() < 0.5 ? 0 : 1)
          : (Math.random() < 0.5 ? 2 : 3);
        var t = lointain
          ? (0.9 + Math.random() * 1.1)
          : (1.2 + Math.random() * 2.2);
        liste.push({
          x: Math.random() * w,
          y: Math.random() * h,
          t: t,
          s: indexSprite(couleur, niveau),
          ph: Math.random() * Math.PI * 2,
          vit: 0.25 + ci * 0.22 + Math.random() * 0.25
        });
      }
      couchesEtoiles.push({ liste: liste, par: REGLAGES.parallaxe[ci] });
    }
  }

  /* ------------------------------------------------------------
     ADAPTATION DE LA DENSITÉ (petits écrans, écrans peu puissants)
     ------------------------------------------------------------ */
  function nombreParticules() {
    var aire = w * h;
    var nb = REGLAGES.particules * (aire / (1440 * 900));
    if (w < 760) { nb *= 0.55; }                       // mobile / fenêtre étroite
    if (dpr > 1.5) { nb *= 0.82; }                     // beaucoup de pixels physiques
    var cores = navigator.hardwareConcurrency || 4;
    if (cores < 4) { nb *= 0.7; }                      // machine modeste
    return Math.max(180, Math.min(1400, Math.round(nb)));
  }

  /* ------------------------------------------------------------
     REDIMENSIONNEMENT + DEVICEPIXELRATIO (plafonné à 2)
     ------------------------------------------------------------ */
  function redimensionner() {
    w = window.innerWidth;
    h = window.innerHeight;
    if (w < 1 || h < 1) { return; }

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    vmax = REGLAGES.vitesseMax;
    vmax2 = vmax * vmax;

    cx = cibleX = w * 0.5;
    cy = cibleY = h * 0.5;

    construireChamp();
    construireParticules(nombreParticules());
    construireEtoiles();

    ctx.clearRect(0, 0, w, h);
    // Rendu immédiat : la page n'est jamais vide, même sans animation.
    temps = 0;
    animerChamp(0);
    render(false);
  }

  /* ------------------------------------------------------------
     MISE À JOUR (pas d'allocation, pas de DOM)
     ------------------------------------------------------------ */
  function majParticules(dt, frotte) {
    var cell = champ.cell, cols = champ.cols, rows = champ.rows, anim = champ.anim;
    var flux = REGLAGES.flux;
    var rayon = REGLAGES.rayonCurseur;
    var force = REGLAGES.forceCurseur;
    var aspirer = REGLAGES.aspirer;
    var noyau = REGLAGES.noyau;
    var inf = influence;
    var v2 = vmax2, vM = vmax;
    var maxIX = cols - 2, maxIY = rows - 2;

    for (var i = 0; i < particules.length; i++) {
      var p = particules[i];

      // Échantillonnage bilinéaire du flow field à la position de la particule.
      var gx = p.x / cell, gy = p.y / cell;
      var ix = gx | 0, iy = gy | 0;
      if (ix < 0) { ix = 0; } else if (ix > maxIX) { ix = maxIX; }
      if (iy < 0) { iy = 0; } else if (iy > maxIY) { iy = maxIY; }
      var fx = gx - ix, fy = gy - iy;
      if (fx < 0) { fx = 0; } else if (fx > 1) { fx = 1; }
      if (fy < 0) { fy = 0; } else if (fy > 1) { fy = 1; }
      var i00 = iy * cols + ix;
      var i10 = i00 + 1;
      var i01 = i00 + cols;
      var i11 = i01 + 1;
      var a0 = anim[i00] + (anim[i10] - anim[i00]) * fx;
      var a1 = anim[i01] + (anim[i11] - anim[i01]) * fx;
      var ang = a0 + (a1 - a0) * fy;

      var ax = Math.cos(ang) * flux;
      var ay = Math.sin(ang) * flux;

      // Vortex du curseur : tourbillon + petite attraction, force bornée.
      if (inf > 0.001) {
        var dx = p.x - cx, dy = p.y - cy;
        var d2 = dx * dx + dy * dy;
        if (d2 < rayon * rayon) {
          var d = Math.sqrt(d2) + 0.0001;
          var att = 1 - d / rayon;
          att = att * att;                       // décroissance douce
          att *= 1 / (1 + d * 0.006);            // profil 1/r, borné (jamais infini)
          var g = force * att * inf;
          var nx = dx / d, ny = dy / d;          // (nx, ny) : du curseur vers la particule
          ax += (-ny) * g - nx * g * aspirer;    // tangentiel (horaire) + attraction
          ay += ( nx) * g - ny * g * aspirer;
          if (d < noyau) {                       // noyau répulsif : évite l'effondrement
            var rep = (1 - d / noyau) * g * 1.4;
            ax += nx * rep;
            ay += ny * rep;
          }
        }
      }

      var vx = (p.vx + ax * dt) * frotte;
      var vy = (p.vy + ay * dt) * frotte;
      var sp = vx * vx + vy * vy;
      if (sp > v2) {
        var f = vM / Math.sqrt(sp);
        vx *= f; vy *= f;
      }
      p.vx = vx;
      p.vy = vy;

      var x = p.x + vx * dt;
      var y = p.y + vy * dt;
      // Enroulement aux bords : la nuée reste dense, sans trou.
      if (x < 0) { x += w; } else if (x >= w) { x -= w; }
      if (y < 0) { y += h; } else if (y >= h) { y -= h; }
      p.x = x;
      p.y = y;
    }
  }

  function maj(dt) {
    // Curseur lissé (suivi doux, jamais nerveux).
    var k = REGLAGES.lerpCurseur;
    cx += (cibleX - cx) * k;
    cy += (cibleY - cy) * k;

    // Fondu de l'influence du vortex.
    var cibleInf = curseurActif ? 1 : 0;
    influence += (cibleInf - influence) * 0.05;
    if (influence < 0.001 && cibleInf === 0) { influence = 0; }

    var frotte = Math.pow(REGLAGES.amorti, dt * 60);
    animerChamp(temps);
    majParticules(dt, frotte);
  }

  /* ------------------------------------------------------------
     RENDU
     ------------------------------------------------------------ */
  function render(avecFondu) {
    if (avecFondu) {
      // Voile noir très peu opaque : au lieu d'effacer, laisse des traînées.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,' + REGLAGES.fondu + ')';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Parallaxe légère des étoiles selon le curseur.
    var dx = cx - w * 0.5;
    var dy = cy - h * 0.5;

    for (var c = 0; c < couchesEtoiles.length; c++) {
      var couche = couchesEtoiles[c];
      var liste = couche.liste;
      var ox = dx * couche.par;
      var oy = dy * couche.par;
      for (var i = 0; i < liste.length; i++) {
        var e = liste[i];
        var t = e.t * (1 + 0.2 * Math.sin(temps * e.vit + e.ph)); // scintillement lent
        ctx.drawImage(SPRITES[e.s], e.x + ox - t * 0.5, e.y + oy - t * 0.5, t, t);
      }
    }

    for (var j = 0; j < particules.length; j++) {
      var p = particules[j];
      ctx.drawImage(SPRITES[p.s], p.x - p.t * 0.5, p.y - p.t * 0.5, p.t, p.t);
    }
  }

  function nettoyageDoux() {
    // Sécurité : la décroissance géométrique suffit déjà, mais on
    // renforce le fondu une fois de temps en temps. Aucun flash.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,' + REGLAGES.nettoyageFonc + ')';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ------------------------------------------------------------
     BOUCLE UNIQUE
     ------------------------------------------------------------ */
  function boucle(now) {
    raf = requestAnimationFrame(boucle);
    var dt = (now - dernier) / 1000;
    dernier = now;
    if (!(dt > 0)) { dt = 1 / 60; }
    if (dt > 0.05) { dt = 0.05; }

    temps += dt;
    maj(dt);
    render(true);

    frames++;
    if (frames % REGLAGES.nettoyage === 0) { nettoyageDoux(); }
  }

  function demarrer() {
    if (reduit || raf) { return; }
    dernier = performance.now();
    raf = requestAnimationFrame(boucle);
  }

  function arreter() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  /* ------------------------------------------------------------
     INTERACTIONS : souris et tactile, passives
     ------------------------------------------------------------ */
  function viser(x, y) {
    cibleX = x;
    cibleY = y;
    curseurActif = true;
  }

  window.addEventListener('pointermove', function (ev) {
    viser(ev.clientX, ev.clientY);
  }, { passive: true });

  window.addEventListener('pointerdown', function (ev) {
    viser(ev.clientX, ev.clientY);
  }, { passive: true });

  // Sur souris, relâcher un clic ne doit pas couper le vortex : on ne
  // désactive donc que pour le tactile.
  window.addEventListener('pointerup', function (ev) {
    if (ev.pointerType === 'touch') { curseurActif = false; }
  }, { passive: true });

  window.addEventListener('pointercancel', function () {
    curseurActif = false;
  }, { passive: true });

  // Curseur qui quitte la fenêtre : on estompe le vortex.
  document.documentElement.addEventListener('pointerleave', function () {
    curseurActif = false;
  }, { passive: true });
  document.addEventListener('mouseleave', function () {
    curseurActif = false;
  }, { passive: true });

  window.addEventListener('touchmove', function (ev) {
    if (ev.touches && ev.touches[0]) {
      viser(ev.touches[0].clientX, ev.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('blur', function () {
    curseurActif = false;
  });

  /* ------------------------------------------------------------
     RESIZE (anti-rebond léger) + DPR
     ------------------------------------------------------------ */
  var minuteurResize = 0;
  function planifierResize() {
    if (minuteurResize) { clearTimeout(minuteurResize); }
    minuteurResize = setTimeout(function () {
      minuteurResize = 0;
      redimensionner();
      if (reduit) { reprendreReduit(); }
    }, 140);
  }
  window.addEventListener('resize', planifierResize, { passive: true });
  window.addEventListener('orientationchange', planifierResize, { passive: true });

  /* ------------------------------------------------------------
     VISIBILITÉ DE L'ONGLET : on met en pause quand il est caché
     ------------------------------------------------------------ */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      arreter();
    } else {
      if (reduit) { reprendreReduit(); } else { demarrer(); }
    }
  });

  /* ------------------------------------------------------------
     MOUVEMENT RÉDUIT : rendu figé, plus léger, aucun vortex
     ------------------------------------------------------------ */
  function reprendreReduit() {
    temps = 0;
    animerChamp(0);
    ctx.clearRect(0, 0, w, h);
    render(false);
  }

  if (mqReduit) {
    var surChangementMouvement = function () {
      reduit = mqReduit.matches;
      if (reduit) { arreter(); reprendreReduit(); }
      else { demarrer(); }
    };
    if (mqReduit.addEventListener) { mqReduit.addEventListener('change', surChangementMouvement); }
    else if (mqReduit.addListener) { mqReduit.addListener(surChangementMouvement); }
  }

  /* ------------------------------------------------------------
     DÉMARRAGE
     ------------------------------------------------------------ */
  redimensionner();
  if (reduit) { reprendreReduit(); } else { demarrer(); }
})();
