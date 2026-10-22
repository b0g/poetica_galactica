/* ============================================================
   Poetica Galactica — interactions
   - constellation de feuilles (placement, parallaxe 3D)
   - lecture plein écran (FLIP)
   - retour des feuilles en cascade (retourEnCascade)
   - machine à écrire : menu qui « tape » les écritures puis le contact
   ============================================================ */
(function () {
  var body = document.body;
  var constellation = document.getElementById('constellation');
  var voile = document.getElementById('voile');

  var mouvementReduit =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Construction des feuilles ---------- */
  (window.POEMES || []).forEach(function (p, i) {
    var art = document.createElement('article');
    art.className = 'feuille';
    art.dataset.id = p.id;
    art.tabIndex = 0;
    art.setAttribute('role', 'button');
    art.setAttribute('aria-label', 'Ouvrir le poème : ' + p.titre);
    art.style.setProperty('--x', p.x + '%');
    art.style.setProperty('--y', p.y + '%');
    art.style.setProperty('--z', p.z + 'px');
    art.style.setProperty('--ry', p.ry + 'deg');
    art.style.setProperty('--rz', p.rz + 'deg');
    art.style.setProperty('--w', p.w + 'px');
    art.style.setProperty('--prof', (1 + p.z / 140).toFixed(2));
    art.style.setProperty('--duree', (7 + (i % 4) * 1.7).toFixed(1) + 's');
    art.style.setProperty('--retard', (-(i * 0.9)).toFixed(1) + 's');
    art.style.setProperty('--derive', ((i % 2 ? 1 : -1) * (5 + i * 1.5)).toFixed(0) + 'px');
    // Décalage de la texture papier, propre à chaque feuille : sans ça, toutes
    // les vignettes montreraient le même coin du motif, et l'œil y verrait une
    // répétition. Deux pas premiers entre eux pour balayer toute la tuile
    // (voir --papier-tuile). Déterministe, donc aucun scintillement.
    art.style.setProperty('--papier-x', ((i * 271) % 768) + 'px');
    art.style.setProperty('--papier-y', ((i * 433) % 768) + 'px');

    var papier = document.createElement('div');
    papier.className = 'papier';

    var titre = document.createElement('h2');
    titre.className = 'titre';
    titre.textContent = p.titre;

    var texte = document.createElement('pre');
    texte.className = 'texte';
    texte.textContent = p.texte;

    var pied = document.createElement('p');
    pied.className = 'pied';
    pied.textContent = p.date ? p.date : '';

    var fermer = document.createElement('button');
    fermer.type = 'button';
    fermer.className = 'fermer';
    fermer.setAttribute('aria-label', 'Fermer le poème');
    fermer.innerHTML = '&times;';

    papier.appendChild(titre);
    papier.appendChild(texte);
    papier.appendChild(pied);
    art.appendChild(papier);
    // La croix est sœur du papier (et non dedans) : le backdrop-filter du
    // papier crée un bloc conteneur qui piégerait un position:fixed.
    art.appendChild(fermer);
    constellation.appendChild(art);
  });

  var feuilles = Array.prototype.slice.call(constellation.querySelectorAll('.feuille'));
  var ouverte = null;

  /* ---------- Retour des feuilles en cascade ---------- */
  // À la fermeture, les autres feuilles ne reviennent pas d'un bloc : un ordre
  // aléatoire, un pas de 300 ms et un léger jitter donnent un retour organique.
  // Le chemin est volontairement minimal : un seul minuteur de nettoyage, pas un
  // minuteur par feuille. Les feuilles s'estompent déjà via leur transition CSS
  // (opacité + flou, 0,5 s) ; il suffit de retarder chacune (`--retour`).
  var RETOUR_PAS = 200;      // écart de base entre deux apparitions, en ms
  var RETOUR_JITTER = 110;   // flou aléatoire ajouté, en ms (rythme irrégulier)
  var feuillesRetour = null;

  function finRetour() {
    if (feuillesRetour) {
      clearTimeout(feuillesRetour);
      feuillesRetour = null;
    }
    body.classList.remove('retour');
    feuilles.forEach(function (f) { f.style.removeProperty('--retour'); });
  }

  function retourEnCascade() {
    if (mouvementReduit) return;
    finRetour();
    // Toutes les feuilles sauf celle qu'on referme (elle reste visible).
    var ordre = feuilles.filter(function (f) { return f !== ouverte; });
    // Mélange de Fisher-Yates : le retour ne suit jamais deux fois le même ordre.
    for (var i = ordre.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tampon = ordre[i];
      ordre[i] = ordre[j];
      ordre[j] = tampon;
    }
    var dernier = 0;
    ordre.forEach(function (f, rang) {
      // Pas régulier + jitter : le rythme reste irrégulier, jamais mécanique.
      var delai = rang * RETOUR_PAS + Math.random() * RETOUR_JITTER;
      f.style.setProperty('--retour', delai.toFixed(0) + 'ms');
      if (delai > dernier) dernier = delai;
    });
    body.classList.add('retour');
    // Nettoyage une fois le dernier fondu terminé (transition : 0,5 s).
    feuillesRetour = setTimeout(finRetour, dernier + 600);
  }

  /* ---------- Parallaxe souris ---------- */
  var cible = { x: 0, y: 0 };
  var doux = { x: 0, y: 0 };
  var bouge = false;
  function animeParallaxe() {
    doux.x += (cible.x - doux.x) * 0.06;
    doux.y += (cible.y - doux.y) * 0.06;
    constellation.style.setProperty('--mx', doux.x.toFixed(2) + 'px');
    constellation.style.setProperty('--my', doux.y.toFixed(2) + 'px');
    if (Math.abs(cible.x - doux.x) > 0.1 || Math.abs(cible.y - doux.y) > 0.1 || bouge) {
      requestAnimationFrame(animeParallaxe);
    } else {
      bouge = false;
    }
  }
  if (!mouvementReduit) {
    window.addEventListener('pointermove', function (ev) {
      cible.x = (ev.clientX / window.innerWidth - 0.5) * -26;
      cible.y = (ev.clientY / window.innerHeight - 0.5) * -18;
      if (!bouge) {
        bouge = true;
        requestAnimationFrame(animeParallaxe);
      }
    });
  }

  /* ---------- Lecture plein écran ---------- */
  function ouvrir(art) {
    if (ouverte) return;
    finRetour();
    var papier = art.querySelector('.papier');
    var avant = papier.getBoundingClientRect();
    body.classList.add('lecture');
    art.classList.add('active');
    var apres = papier.getBoundingClientRect();
    var dx = avant.left - apres.left;
    var dy = avant.top - apres.top;
    var sx = apres.width ? avant.width / apres.width : 1;
    var sy = apres.height ? avant.height / apres.height : 1;
    if (!mouvementReduit) {
      // Ouverture en douceur : départ plus vif, arrivée longue et posée.
      // L'opacité s'arrête à 0,995 (voir .papier dans style.css).
      papier.animate(
        [
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', opacity: 0.35 },
          { transform: 'none', opacity: 0.995 }
        ],
        { duration: 640, easing: 'cubic-bezier(.22,.9,.26,1)' }
      );
    }
    ouverte = art;
    var f = art.querySelector('.fermer');
    if (f) f.focus({ preventScroll: true });
  }

  function fermer() {
    if (!ouverte) return;
    var art = ouverte;
    var papier = art.querySelector('.papier');
    var avant = papier.getBoundingClientRect();
    // Les retards doivent être posés AVANT de retirer .lecture, sinon la
    // transition d'opacité est déjà lancée et le délai n'a plus d'effet.
    retourEnCascade();
    art.classList.remove('active');
    body.classList.remove('lecture');
    ouverte = null;
    var apres = papier.getBoundingClientRect();
    var dx = avant.left - apres.left;
    var dy = avant.top - apres.top;
    var sx = apres.width ? avant.width / apres.width : 1;
    var sy = apres.height ? avant.height / apres.height : 1;
    if (!mouvementReduit) {
      papier.animate(
        [
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
          { transform: 'none' }
        ],
        { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }
  }

  feuilles.forEach(function (art) {
    art.addEventListener('click', function (ev) {
      // Croix de fermeture
      if (ev.target.closest && ev.target.closest('.fermer')) {
        ev.stopPropagation();
        fermer();
        return;
      }
      // Déjà ouvert : on laisse remonter (un clic dans le vide ferme)
      if (art.classList.contains('active')) return;
      ev.stopPropagation();
      fermerMachine();
      ouvrir(art);
    });
    art.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        fermerMachine();
        ouvrir(art);
      }
    });
  });

  // Tout clic qui arrive jusqu'ici est un clic « à côté » du poème ouvert
  constellation.addEventListener('click', function () {
    if (body.classList.contains('lecture')) fermer();
  });

  voile.addEventListener('click', fermer);

  /* ---------- Machine à écrire (menu) ---------- */
  var machine = document.getElementById('machine');
  var page = document.getElementById('page-machine');
  var pre = document.getElementById('machine-texte');
  var noeud = document.createTextNode('');
  var curseur = document.createElement('span');
  curseur.className = 'curseur';
  curseur.textContent = '\u258c';
  pre.appendChild(noeud);
  pre.appendChild(curseur);

  function texteMachine() {
    var lignes = [];
    lignes.push('POETICA GALACTICA');
    lignes.push('──────────────────────');
    lignes.push('');
    lignes.push('PROCHAINES ÉCRITURES');
    lignes.push('');
    (window.ECRITURES || []).forEach(function (e) {
      lignes.push('· ' + e.titre);
      lignes.push('  ' + e.lieu + ' · ' + e.quand);
      lignes.push('');
    });
    lignes.push('──────────────────────');
    lignes.push('CONTACT');
    lignes.push('');
    lignes.push((window.CONTACT || {}).email || '');
    lignes.push((window.CONTACT || {}).zone || '');
    lignes.push('');
    return lignes.join('\n');
  }

  var complet = texteMachine();
  var minuteur = null;

  function taper() {
    var i = 0;
    pre.classList.add('tape');
    function pas() {
      if (i >= complet.length) {
        pre.classList.remove('tape');
        return;
      }
      var c = complet.charAt(i);
      i += 1;
      noeud.nodeValue = complet.slice(0, i);
      var pause = c === '\n' ? 90 : 0;
      minuteur = setTimeout(pas, 11 + pause + Math.random() * 14);
    }
    pas();
  }

  function ouvrirMachine() {
    if (body.classList.contains('machine-ouverte')) return;
    fermer();
    body.classList.add('machine-ouverte');
    machine.setAttribute('aria-expanded', 'true');
    noeud.nodeValue = '';
    if (mouvementReduit) {
      noeud.nodeValue = complet;
      return;
    }
    minuteur = setTimeout(taper, 380);
  }

  function fermerMachine() {
    if (!body.classList.contains('machine-ouverte')) return;
    body.classList.remove('machine-ouverte');
    machine.setAttribute('aria-expanded', 'false');
    if (minuteur) {
      clearTimeout(minuteur);
      minuteur = null;
    }
    pre.classList.remove('tape');
  }

  machine.addEventListener('click', function (ev) {
    ev.stopPropagation();
    if (body.classList.contains('machine-ouverte')) {
      fermerMachine();
    } else {
      ouvrirMachine();
    }
  });
  page.addEventListener('click', function (ev) {
    ev.stopPropagation();
  });

  document.addEventListener('click', function () {
    fermerMachine();
  });

  /* ---------- Clavier ---------- */
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      if (ouverte) {
        fermer();
      } else {
        fermerMachine();
      }
    }
  });
})();
