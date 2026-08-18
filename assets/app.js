/* Subsides de Binche — application (vanilla JS, sans dépendance).
   Transposition du prototype Claude Design « Subsides Binche v2 ».
   Données : window.SUBS_DATA (data.js) — Moteur : window.SIM (sim-rules.js). */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Configuration                                                        */
  /* ------------------------------------------------------------------ */
  var CONTACT_EMAIL = 'je.gigounon@gmail.com'; // TEMPORAIRE (tests) — remettre mr-ci.binche@gmail.com avec sa propre clé Web3Forms
  // Envoi direct du formulaire de contact via Web3Forms (https://web3forms.com).
  // Coller ici l'access key reçue par e-mail à CONTACT_EMAIL. Si vide, repli sur mailto:.
  var FORM_ACCESS_KEY = 'e881b05d-ebab-4fd7-baa1-be0c6e44c8f7';
  var FORM_ENDPOINT = 'https://api.web3forms.com/submit';
  var SHOW_CERT = false; // afficher le niveau de certitude de la catégorisation

  var ROUTES = { home: '', sim: 'simulateur', explore: 'qui-recoit-quoi', prop: 'proposition', contact: 'contact' };
  var NAV = [['home', 'Accueil'], ['sim', 'Tester mes droits'], ['explore', 'Qui reçoit quoi ?'], ['prop', 'Proposition MR-CI']];
  var CATMAP = { culturelles: 'Associations culturelles locales', sportives: 'Associations sportives locales', jeunesse: 'Organisation de jeunesse', aines: 'Personnes âgées', horticoles: 'Cercles horticoles et petits élevages', photo_cine: 'Photo, ciné et vidéos', handicap: 'Aides aux handicapés', ornithologiques: 'Sociétés ornithologiques', one: 'Sections locales ONE', musicales: 'Sociétés musicales et chorales', patriotiques: 'Sociétés patriotiques', kermesses: 'Organisateurs de kermesses communales', carnavalesques: 'Sociétés carnavalesques', nominatif: 'HORS BARÈME — Subside nominatif' };
  var GRAD = 'linear-gradient(90deg,#ff4fa0,#ff9d52,#ffd35e)';
  var FC = "'Barlow Condensed',sans-serif";

  var PROP_PRINCIPES = [
    { n: '1', t: 'Un règlement unique.', d: 'Les 14 règlements de 2009 fusionnés en un seul texte : mêmes définitions, mêmes délais, même formulaire pour toutes les associations.' },
    { n: '2', t: 'Des critères objectifs et publiés.', d: 'Chaque euro rattaché à un critère vérifiable (membres, activités, jeunesse). Les subsides nominatifs deviennent l’exception motivée, plus la zone grise.' },
    { n: '3', t: 'Un dossier unique et simplifié.', d: 'Une demande en ligne ou papier, une fois par an, avec les justificatifs proportionnés à la taille de l’association.' },
    { n: '4', t: 'La transparence par défaut.', d: 'Publication annuelle de la liste complète des bénéficiaires, montants en espèces et en nature compris — comme le fait déjà ce site.' }
  ];
  var PROP_AVANT = [
    '14 règlements distincts, inchangés depuis 2009',
    'Anomalies de barème (clubs de 200+ membres pénalisés, camps de moins de 15 participants exclus)',
    'Subsides nominatifs décidés au budget, sans critères publiés',
    'Aides en nature valorisées mais peu visibles',
    'Formulaire papier en 3 exemplaires'
  ];
  var PROP_APRES = [
    'Un règlement unique, lisible par tous',
    'Barèmes corrigés et progressifs',
    'Critères publiés pour chaque type de soutien',
    'Espèces et nature publiés chaque année, association par association',
    'Dossier unique, en ligne ou papier'
  ];

  /* ------------------------------------------------------------------ */
  /* État                                                                 */
  /* ------------------------------------------------------------------ */
  var st = {
    screen: 'home', simStep: 1, simCat: null, answers: {}, cgOpen: false, assoName: '', nameError: false,
    query: '', catFilter: 'all', sortKey: 't', expanded: null,
    cNom: '', cPrenom: '', cEmail: '', cTel: '', cMsg: '', cErr: '', simContext: false, cSending: false, cSent: false, cHoney: '',
    toastReady: false, toastDismissed: false
  };
  var S, DATA, eur;
  var app = document.getElementById('app');
  var handlers = {}; // id -> fonction (actions liées au rendu courant)
  var hid = 0;

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                          */
  /* ------------------------------------------------------------------ */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function on(fn) { var id = 'h' + (++hid); handlers[id] = fn; return id; }
  function num(v) { v = Number(v); return isNaN(v) ? 0 : v; }
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function kEur(n) { return n >= 1000000 ? (n / 1000000).toLocaleString('fr-BE', { maximumFractionDigits: 2 }) + ' M€' : Math.round(n / 1000).toLocaleString('fr-BE') + '.000 €'; }
  function set(patch) { for (var k in patch) st[k] = patch[k]; render(); }
  function setAns(id, v, rerender) { st.answers[id] = v; if (rerender !== false) render(); }
  function go(screen, patch) {
    if (patch) for (var k in patch) st[k] = patch[k];
    st.screen = screen;
    var hash = '#/' + ROUTES[screen];
    if (location.hash !== hash) { suppressHash = true; location.hash = hash; }
    window.scrollTo(0, 0);
    render();
  }
  var suppressHash = false;
  function screenFromHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    for (var k in ROUTES) if (ROUTES[k] === h) return k;
    return 'home';
  }
  function dismissToast() { st.toastDismissed = true; try { sessionStorage.setItem('mrciToastDismissed', '1'); } catch (e) {} render(); }

  /* Blocs réutilisables */
  var CARD = 'background:#fff;border:1px solid #e3e6f2;border-radius:8px;';
  function h1(txt) { return '<h1 style="font:800 34px ' + FC + ';font-style:italic;text-transform:uppercase;margin:0;color:#000F9F">' + txt + '</h1>'; }
  function tag(grad) { return '<div style="width:34px;height:12px;transform:skewX(-25deg);background:' + (grad ? GRAD : '#002eff') + ';flex-shrink:0"></div>'; }
  function tagSm(grad) { return '<div style="width:28px;height:10px;transform:skewX(-25deg);background:' + (grad ? 'linear-gradient(90deg,#ff4fa0,#ffd35e)' : '#002eff') + ';flex-shrink:0"></div>'; }
  function h2(txt) { return '<h2 style="font:800 26px ' + FC + ';font-style:italic;text-transform:uppercase;color:#000F9F;margin:0">' + txt + '</h2>'; }
  function skewBtn(action, label, style, hovClass) {
    return '<button data-act="' + action + '" class="' + (hovClass || 'hov-dark') + '" style="transform:skewX(-10deg);background:#002eff;color:#fff;border:none;border-radius:5px;padding:12px 22px;font:700 16px ' + FC + ';text-transform:uppercase;letter-spacing:.06em;cursor:pointer;' + (style || '') + '">' + label + '</button>';
  }

  /* ------------------------------------------------------------------ */
  /* En-tête / pied de page                                              */
  /* ------------------------------------------------------------------ */
  function renderHeader() {
    var nav = NAV.map(function (it) {
      var onIt = st.screen === it[0];
      return '<button data-act="' + on(function () { go(it[0]); }) + '" class="nav-btn' + (onIt ? ' on' : '') + '" style="border:none;transform:skewX(-10deg);border-radius:4px;padding:8px 14px;font:700 15px ' + FC + ';text-transform:uppercase;letter-spacing:.05em;cursor:pointer;' + (onIt ? 'background:#002eff;color:#fff' : 'background:#eef0f8;color:#2a3060') + '">' + it[1] + '</button>';
    }).join('');
    return '<header style="background:#fff;position:sticky;top:0;z-index:20;box-shadow:0 1px 0 #e6e8f2">' +
      '<div style="max-width:1060px;margin:0 auto;padding:12px 16px 9px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
        '<a href="#/" data-act="' + on(function () { go('home'); }) + '" style="display:flex;align-items:center;gap:12px;margin-right:auto;cursor:pointer;text-decoration:none">' +
          '<img src="assets/logo-mrci.png" alt="MR-CI" style="height:30px;display:block;flex-shrink:0">' +
          '<div style="font:800 20px ' + FC + ';font-style:italic;text-transform:uppercase;letter-spacing:.02em;color:#000F9F;line-height:1">Subsides <span style="color:#10143a">de Binche</span></div>' +
        '</a>' +
        '<nav aria-label="Navigation principale" style="display:flex;gap:7px;flex-wrap:wrap">' + nav + '</nav>' +
      '</div>' +
      '<div style="height:3px;background:linear-gradient(90deg,#002eff 0%,#000F9F 45%,#ff4fa0 65%,#ff9d52 82%,#ffd35e 100%)"></div>' +
    '</header>';
  }

  function renderFooter() {
    return '<footer style="background:#0a0d2b;color:#9aa1c8;font-size:12.5px;line-height:1.6">' +
      '<div style="max-width:1060px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:8px">' +
        '<img src="assets/logo-mrci.png" alt="MR-CI" style="height:22px;display:block;align-self:start">' +
        '<div><strong style="color:#fff">Subsides de Binche</strong> — initiative du groupe MR-CI (opposition), Conseil communal de Binche. Ce site n\'est pas un site officiel de la Ville de Binche.</div>' +
        '<div>Sources&nbsp;: règlement général et règlements spécifiques du 12/10/2009, modifications des 20/12/2016 et 19/02/2019&nbsp;; budget communal. Simulation indicative&nbsp;— seule la décision du Conseil communal fait foi.</div>' +
        '<div>Contact&nbsp;: <a href="#/contact" data-act="' + on(function () { goContact('Bonjour,\n\n', false); }) + '" style="color:#c5cfff">' + CONTACT_EMAIL + '</a></div>' +
      '</div>' +
    '</footer>';
  }

  /* ------------------------------------------------------------------ */
  /* Accueil                                                              */
  /* ------------------------------------------------------------------ */
  function renderHome() {
    var tE = 0, tN = 0, tT = 0;
    DATA.forEach(function (d) { tE += d.e; tN += d.n; tT += d.t; });
    var pctE = tT ? (tE / tT * 100) : 50;
    var nAssos = DATA.length || 169;
    function stat(delay, grad, val, label) {
      return '<div style="' + CARD + 'padding:16px 18px 14px;animation:rise .45s ease ' + delay + 's both">' +
        '<div style="width:30px;height:8px;transform:skewX(-25deg);background:' + (grad ? 'linear-gradient(90deg,#ff4fa0,#ffd35e)' : '#002eff') + ';margin-bottom:10px"></div>' +
        '<div style="font:800 34px ' + FC + ';font-style:italic;color:#000F9F;line-height:1">' + val + '</div>' +
        '<div style="font-size:13px;color:#4a5180;margin-top:4px">' + label + '</div></div>';
    }
    return '<div data-screen="Accueil">' +
      '<section style="background:#000F9F;background-image:radial-gradient(720px 360px at 88% 118%,rgba(255,79,160,.30),transparent 62%),repeating-linear-gradient(115deg,rgba(255,255,255,.045) 0px,rgba(255,255,255,.045) 2px,transparent 2px,transparent 120px);color:#fff;clip-path:polygon(0 0,100% 0,100% calc(100% - 34px),0 100%);padding-bottom:34px">' +
        '<div style="max-width:1060px;margin:0 auto;padding:54px 16px 58px">' +
          '<div style="display:inline-block;transform:skewX(-10deg);background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.28);padding:6px 16px;font:700 13px ' + FC + ';letter-spacing:.14em;animation:rise .5s ease both">INITIATIVE DU GROUPE MR-CI · CONSEIL COMMUNAL DE BINCHE</div>' +
          '<h1 style="font:800 clamp(42px,8.5vw,76px) ' + FC + ';font-style:italic;text-transform:uppercase;line-height:.96;letter-spacing:.005em;margin:20px 0 14px;max-width:720px;text-wrap:pretty;animation:rise .5s ease .08s both">Où vont les <span style="background:linear-gradient(90deg,#ff4fa0,#ff9d52 60%,#ffd35e);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#ffd35e">subsides communaux</span> de Binche&nbsp;?</h1>' +
          '<p style="font-size:17px;line-height:1.55;color:#ccd4ff;max-width:580px;margin:0 0 32px;animation:rise .5s ease .16s both">À Binche, 14 règlements différents encadrent les subsides aux associations. Difficile pour une association de savoir à quoi elle a droit — et difficile de vérifier que chaque subside respecte les règles. Ce site rend tout cela lisible.</p>' +
          '<div style="display:flex;gap:16px;flex-wrap:wrap;animation:rise .5s ease .24s both">' +
            '<button data-act="' + on(function () { go('sim'); }) + '" class="hov-lift" style="transform:skewX(-10deg);background:#fff;color:#000F9F;border:none;padding:0;cursor:pointer;border-radius:6px;box-shadow:0 10px 26px rgba(0,0,0,.25)">' +
              '<span style="display:flex;flex-direction:column;gap:4px;text-align:left;transform:skewX(10deg);padding:18px 26px">' +
                '<span style="font:800 24px ' + FC + ';font-style:italic;text-transform:uppercase;line-height:1">Tester mes droits →</span>' +
                '<span style="font-size:13px;color:#3a4390;line-height:1.45;max-width:250px">Estimez ce que votre association devrait recevoir selon le règlement.</span>' +
              '</span></button>' +
            '<button data-act="' + on(function () { go('explore'); }) + '" class="hov-lift" style="transform:skewX(-10deg);background:linear-gradient(100deg,#ff4fa0,#ff9d52 60%,#ffd35e);color:#1a0b2e;border:none;padding:0;cursor:pointer;border-radius:6px;box-shadow:0 10px 26px rgba(255,79,160,.30)">' +
              '<span style="display:flex;flex-direction:column;gap:4px;text-align:left;transform:skewX(10deg);padding:18px 26px">' +
                '<span style="font:800 24px ' + FC + ';font-style:italic;text-transform:uppercase;line-height:1;color:#421D73">Qui reçoit quoi&nbsp;? →</span>' +
                '<span style="font-size:13px;color:#3d1c2e;line-height:1.45;max-width:250px">Les ' + nAssos + ' associations subsidiées, montants espèces et nature.</span>' +
              '</span></button>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section style="max-width:1060px;margin:-20px auto 0;padding:0 16px;position:relative;z-index:2">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">' +
          stat('.05', false, nAssos, 'associations subsidiées') +
          stat('.12', true, kEur(tT), 'de soutien communal par an') +
          stat('.19', false, '14', 'règlements distincts à unifier') +
          stat('.26', true, '2009', 'dernière refonte du règlement') +
        '</div>' +
        '<div style="' + CARD + 'padding:18px;margin-top:12px;animation:rise .45s ease .32s both">' +
          '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font:700 15px ' + FC + ';text-transform:uppercase;letter-spacing:.05em">' +
            '<span style="color:#002eff">En espèces&nbsp;: ' + eur(Math.round(tE)) + '</span>' +
            '<span style="color:#c2410c">En nature (locaux, personnel, logistique)&nbsp;: ' + eur(Math.round(tN)) + '</span>' +
          '</div>' +
          '<div style="transform:skewX(-15deg);display:flex;height:14px;border-radius:3px;overflow:hidden;margin:12px 4px 2px;background:#e9ecf6">' +
            '<div style="background:#002eff;transform-origin:left;animation:growX .7s ease .2s both;width:' + pctE + '%"></div>' +
            '<div style="background:' + GRAD + ';transform-origin:left;animation:growX .7s ease .35s both;width:' + (100 - pctE) + '%"></div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section style="max-width:1060px;margin:0 auto;padding:20px 16px 52px">' +
        '<div style="' + CARD + 'padding:20px;display:flex;gap:16px;flex-wrap:wrap;align-items:center;position:relative;overflow:hidden">' +
          '<div style="position:absolute;left:0;top:0;bottom:0;width:7px;background:linear-gradient(180deg,#ff4fa0,#ffd35e)"></div>' +
          '<div style="flex:1;min-width:240px;padding-left:8px">' +
            '<div style="font:800 20px ' + FC + ';font-style:italic;text-transform:uppercase;color:#000F9F">Un seul règlement au lieu de 14</div>' +
            '<p style="font-size:14px;color:#4a5180;line-height:1.5;margin:6px 0 0">Le groupe MR-CI propose d\'unifier les 14 règlements en un texte unique&nbsp;: plus lisible pour les associations, plus contrôlable pour les élus.</p>' +
          '</div>' +
          skewBtn(on(function () { go('prop'); }), 'Lire la proposition') +
        '</div>' +
      '</section>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Simulateur                                                           */
  /* ------------------------------------------------------------------ */
  function pill(onIt) { return 'text-align:left;border-radius:6px;padding:11px 14px;font-size:14px;cursor:pointer;line-height:1.4;' + (onIt ? 'background:#002eff;color:#fff;border:1px solid #002eff;font-weight:700' : 'background:#f6f7fc;color:#10143a;border:1px solid #c6cde8'); }
  function stepBar(onIt) { return 'flex:1;height:8px;transform:skewX(-30deg);border-radius:2px;background:' + (onIt ? 'linear-gradient(90deg,#002eff,#0026e0)' : '#dfe3f0'); }
  var INPUT = 'border:1px solid #c6cde8;border-radius:6px;padding:10px 12px;font-size:16px;';

  function currentCat() { return S.cats.find(function (c) { return c.id === st.simCat; }) || null; }

  function renderSim() {
    var cat = currentCat();
    var body = '';
    if (st.simStep === 1) body = renderSimStep1();
    else if (st.simStep === 2) body = renderSimStep2(cat);
    else body = renderSimStep3(cat);
    return '<div data-screen="Simulateur" style="max-width:760px;margin:0 auto;padding:30px 16px 56px">' +
      '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
        h1('Tester mes droits') +
        '<div style="font:700 15px ' + FC + ';letter-spacing:.08em;color:#6a71a0">ÉTAPE ' + st.simStep + ' / 3</div>' +
      '</div>' +
      '<div style="display:flex;gap:7px;margin:14px 4px 26px">' +
        '<div style="' + stepBar(st.simStep >= 1) + '"></div><div style="' + stepBar(st.simStep >= 2) + '"></div><div style="' + stepBar(st.simStep >= 3) + '"></div>' +
      '</div>' + body + '</div>';
  }

  function renderSimStep1() {
    var cats = S.cats.map(function (c) {
      return '<button data-act="' + on(function () {
        if (!st.assoName.trim()) { set({ nameError: true }); window.scrollTo(0, 0); return; }
        st.simCat = c.id; st.answers = {}; st.simStep = c.questions.length ? 2 : 3; st.cgOpen = false;
        window.scrollTo(0, 0); render();
      }) + '" class="hov-card" style="text-align:left;' + CARD + 'padding:14px;cursor:pointer;display:flex;flex-direction:column;gap:5px;position:relative;overflow:hidden">' +
        '<span style="font-size:20px">' + c.icon + '</span>' +
        '<span style="font:700 17px ' + FC + ';text-transform:uppercase;letter-spacing:.02em;color:#10143a;line-height:1.1">' + esc(c.label) + '</span>' +
        '<span style="font-size:12.5px;color:#4a5180;line-height:1.4">' + esc(c.pour) + '</span>' +
        '<span style="font:700 14px ' + FC + ';font-style:italic;letter-spacing:.03em;color:#002eff;margin-top:2px;text-transform:uppercase">' + esc(c.teaser) + '</span>' +
      '</button>';
    }).join('');
    return '<div style="' + CARD + 'padding:16px;margin-bottom:18px;animation:rise .4s ease both">' +
        '<label for="asso-name" style="font-weight:700;font-size:14.5px;display:block;margin-bottom:6px">Le nom de votre association</label>' +
        '<input id="asso-name" type="text" placeholder="ex. Royale Harmonie de Ressaix" value="' + esc(st.assoName) + '" data-input="' + on(function (e) { st.assoName = e.target.value; if (st.nameError) { st.nameError = false; render(); } }) + '" style="width:100%;border-radius:6px;padding:12px 14px;font-size:16px;border:1px solid ' + (st.nameError ? '#c22a1e' : '#c6cde8') + '">' +
        (st.nameError ? '<div style="color:#c22a1e;font-size:13px;font-weight:600;margin-top:6px">Indiquez d\'abord le nom de votre association.</div>' : '') +
      '</div>' +
      '<p style="font-size:15px;color:#4a5180;margin:0 0 14px;line-height:1.5;animation:rise .4s ease .06s both">Puis choisissez la catégorie dont votre association relève&nbsp;— chacune a son propre règlement.</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;animation:rise .4s ease .12s both">' + cats + '</div>';
  }

  function renderQuestion(q) {
    var a = st.answers, html = '';
    if (q.type === 'bool') {
      html = '<div style="display:flex;gap:8px;margin-top:8px">' +
        '<button data-act="' + on(function () { setAns(q.id, true); }) + '" style="' + pill(a[q.id] === true) + ';flex:1;text-align:center">Oui</button>' +
        '<button data-act="' + on(function () { setAns(q.id, false); }) + '" style="' + pill(a[q.id] === false) + ';flex:1;text-align:center">Non</button></div>';
    } else if (q.type === 'number') {
      html = '<input type="number" min="0" inputmode="numeric" value="' + esc(a[q.id] == null ? '' : a[q.id]) + '" data-input="' + on(function (e) { setAns(q.id, e.target.value, false); }) + '" style="margin-top:8px;width:130px;' + INPUT + '">';
    } else if (q.type === 'enum') {
      html = '<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">' + q.options.map(function (o) {
        return '<button data-act="' + on(function () { setAns(q.id, o[0]); }) + '" style="' + pill(a[q.id] === o[0]) + '">' + esc(o[1]) + '</button>';
      }).join('') + '</div>';
    } else if (q.type === 'liste') {
      var camps = a[q.id] || [];
      html = '<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">' + camps.map(function (c, i) {
        return '<div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;background:#f6f7fc;border:1px solid #e3e7f5;border-radius:8px;padding:10px 12px">' +
          '<div><div style="font-size:11.5px;color:#6a71a0;margin-bottom:3px">Durée (jours)</div><input type="number" min="0" inputmode="numeric" value="' + esc(c.duree_jours == null ? '' : c.duree_jours) + '" data-input="' + on(function (e) { camps[i].duree_jours = e.target.value; }) + '" style="width:90px;border:1px solid #c6cde8;border-radius:6px;padding:8px 10px;font-size:15px"></div>' +
          '<div><div style="font-size:11.5px;color:#6a71a0;margin-bottom:3px">Participants 6–18 ans</div><input type="number" min="0" inputmode="numeric" value="' + esc(c.participants_6_18 == null ? '' : c.participants_6_18) + '" data-input="' + on(function (e) { camps[i].participants_6_18 = e.target.value; }) + '" style="width:110px;border:1px solid #c6cde8;border-radius:6px;padding:8px 10px;font-size:15px"></div>' +
          '<button data-act="' + on(function () { setAns(q.id, camps.filter(function (_, j) { return j !== i; })); }) + '" style="background:none;border:none;color:#6a71a0;font-size:13px;cursor:pointer;padding:8px 4px;text-decoration:underline">Retirer</button>' +
        '</div>';
      }).join('') +
        '<button data-act="' + on(function () { setAns(q.id, camps.concat([{ duree_jours: '', participants_6_18: '' }])); }) + '" style="align-self:start;background:#eef1fc;color:#002eff;border:1px dashed #aab6e8;border-radius:6px;padding:9px 14px;font-weight:600;font-size:13.5px;cursor:pointer">+ Ajouter un camp</button>' +
      '</div>';
    }
    return '<div>' +
      '<div style="font-weight:600;font-size:14.5px;line-height:1.45;margin-bottom:3px">' + esc(q.label) + '</div>' +
      (q.hint ? '<div style="font-size:12px;color:#6a71a0;margin-bottom:6px">' + esc(q.hint) + '</div>' : '') +
      html + '</div>';
  }

  function renderSimStep2(cat) {
    var qs = cat.questions.filter(function (q) { return !q.visible || q.visible(st.answers); }).map(renderQuestion).join('');
    return '<div style="' + CARD + 'padding:20px;animation:rise .4s ease both">' +
      '<div style="display:flex;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid #e9ecf6">' +
        '<span style="font-size:22px">' + cat.icon + '</span>' +
        '<div><div style="font:700 20px ' + FC + ';font-style:italic;text-transform:uppercase;color:#000F9F;line-height:1.05">' + esc(cat.label) + '</div>' +
        '<div style="font-size:12px;color:#6a71a0;margin-top:2px">' + esc(st.assoName) + ' · ' + esc(cat.ref) + '</div></div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:20px;padding-top:18px">' + qs + '</div>' +
      '<div style="display:flex;gap:12px;margin-top:24px;padding-top:16px;border-top:1px solid #e9ecf6;flex-wrap:wrap">' +
        '<button data-act="' + on(function () { st.simStep = 1; st.simCat = null; st.answers = {}; window.scrollTo(0, 0); render(); }) + '" style="transform:skewX(-10deg);background:none;border:1px solid #c6cde8;color:#4a5180;border-radius:5px;padding:12px 18px;font:700 15px ' + FC + ';text-transform:uppercase;letter-spacing:.05em;cursor:pointer">← Catégorie</button>' +
        '<button data-act="' + on(function () { st.simStep = 3; st.cgOpen = false; window.scrollTo(0, 0); render(); }) + '" class="hov-dark" style="transform:skewX(-10deg);background:#002eff;color:#fff;border:none;border-radius:5px;padding:12px 22px;font:700 17px ' + FC + ';text-transform:uppercase;letter-spacing:.06em;cursor:pointer;flex:1;min-width:180px">Voir mon estimation →</button>' +
      '</div>' +
    '</div>';
  }

  function computeResult(cat) {
    var res = cat ? cat.compute(st.answers) : { lines: [], notes: [] };
    res.lines = res.lines || []; res.notes = res.notes || [];
    var firm = res.lines.filter(function (l) { return l.amount != null; });
    var total = firm.reduce(function (s, l) { return s + l.amount; }, 0);
    return { res: res, firm: firm, total: total };
  }

  function buildSimSummary(cat, r) {
    var s = 'Bonjour,\n\nNous souhaitons vérifier notre dossier de subside communal.\n\nAssociation : ' + st.assoName + '\nCatégorie : ' + (cat ? cat.label : '') + '\nEstimation obtenue : ' + (r.firm.length ? eur(r.total) : 'aucun montant (voir simulateur)') + '\n';
    if (r.res.lines.length) { s += '\nDétail de la simulation :\n'; r.res.lines.forEach(function (l) { s += '- ' + l.label + ' (' + l.article + ') : ' + l.amountText + '\n'; }); }
    s += '\nPouvez-vous nous aider à introduire la demande auprès de la Ville ?\n';
    return s;
  }

  function renderSimStep3(cat) {
    var r = computeResult(cat), res = r.res;
    var hasCond = res.lines.some(function (l) { return l.cond; });
    var notes = res.notes.slice();
    if (hasCond) notes.push('Les lignes en orange sont des suppléments conditionnels, non inclus dans le total : ils dépendent d’une désignation annuelle.');
    var noTotalTitle = res.ineligible ? 'Non éligible selon le barème actuel' : (res.nominatif ? 'Montant fixé au budget, sans barème' : 'Estimation impossible avec ces réponses');
    var lines = res.lines.map(function (l) {
      var amountStyle = 'font:800 18px ' + FC + ';font-style:italic;white-space:nowrap;' + (l.cond ? 'color:#b06000;font-size:14px;max-width:130px;white-space:normal;text-align:right' : 'color:#000F9F');
      return '<div style="display:flex;justify-content:space-between;gap:14px;align-items:baseline;padding:10px 0;border-bottom:1px solid #eef0f8">' +
        '<div style="flex:1"><div style="font-size:14px;line-height:1.45">' + esc(l.label) + '</div>' +
        '<div style="font-size:12px;color:#6a71a0;margin-top:2px">' + esc(l.article) + ' <span style="color:#b06000">' + esc(l.note || '') + '</span></div></div>' +
        '<div style="' + amountStyle + '">' + esc((l.cond ? '+ ' : '') + l.amountText) + '</div></div>';
    }).join('');
    var cgList = function (arr) { return arr.map(function (e) { return '<div style="display:flex;gap:8px;padding:3px 0"><span style="color:#002eff">•</span><span>' + esc(e.t) + ' <span style="color:#8a90b8">(' + esc(e.a) + ')</span></span></div>'; }).join(''); };

    return '<div style="' + CARD + 'overflow:hidden;animation:rise .4s ease both">' +
      '<div style="background:#000F9F;background-image:radial-gradient(420px 200px at 90% 120%,rgba(255,79,160,.25),transparent 60%),repeating-linear-gradient(115deg,rgba(255,255,255,.04) 0 2px,transparent 2px 100px);color:#fff;padding:22px 20px 24px">' +
        '<div style="font:700 14px ' + FC + ';letter-spacing:.1em;text-transform:uppercase;color:#aab6ff">' + esc(st.assoName) + ' · ' + esc(cat ? cat.label : '') + '</div>' +
        (r.firm.length
          ? '<div style="font:800 56px ' + FC + ';font-style:italic;margin-top:6px;line-height:1">' + eur(r.total) + '</div>' +
            '<div style="width:130px;height:7px;transform:skewX(-25deg);background:linear-gradient(90deg,#ff4fa0,#ffd35e);margin:10px 0 8px"></div>' +
            '<div style="font-size:13.5px;color:#ccd4ff">estimation annuelle en espèces, hors aides en nature</div>'
          : '<div style="font:800 30px ' + FC + ';font-style:italic;text-transform:uppercase;margin-top:6px;line-height:1.1">' + noTotalTitle + '</div>' +
            '<div style="width:130px;height:7px;transform:skewX(-25deg);background:linear-gradient(90deg,#ff4fa0,#ffd35e);margin:12px 0 0"></div>') +
      '</div>' +
      (res.lines.length ? '<div style="padding:6px 20px 0"><div style="font:700 15px ' + FC + ';color:#6a71a0;letter-spacing:.12em;padding:14px 0 4px">DÉTAIL DU CALCUL</div>' + lines + '</div>' : '') +
      '<div style="padding:14px 20px 20px;display:flex;flex-direction:column;gap:10px">' +
        notes.map(function (t) { return '<div style="background:#f6f7fc;border:1px solid #e3e7f5;border-radius:8px;padding:11px 14px;font-size:13.5px;color:#3a4170;line-height:1.5">' + esc(t) + '</div>'; }).join('') +
        '<button data-act="' + on(function () { set({ cgOpen: !st.cgOpen }); }) + '" aria-expanded="' + st.cgOpen + '" style="text-align:left;background:none;border:1px solid #e3e6f2;border-radius:8px;padding:12px 14px;cursor:pointer;font:700 16px ' + FC + ';text-transform:uppercase;letter-spacing:.04em;color:#000F9F">' + (st.cgOpen ? '▾' : '▸') + ' Conditions générales d\'éligibilité et obligations</button>' +
        (st.cgOpen ? '<div style="border:1px solid #e3e6f2;border-radius:8px;padding:14px;font-size:13.5px;line-height:1.55;color:#3a4170">' +
          '<div style="font-weight:700;color:#000F9F;margin-bottom:6px">Pour être éligible (règlement général, CC 12/10/2009)</div>' + cgList(S.cg.eligibilite) +
          '<div style="font-weight:700;color:#000F9F;margin:12px 0 6px">Vos obligations si le subside est accordé</div>' + cgList(S.cg.obligations) +
        '</div>' : '') +
        '<div style="background:#fff8ec;border:1px solid #f0dcae;border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.55;color:#7a5a10"><strong>Avertissement.</strong> ' + esc(S.cg.avertissement) + '</div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:2px">' +
          '<button data-act="' + on(function () {
            var c = cat ? CATMAP[cat.id] : null, counts = catCounts();
            go('explore', { catFilter: c && counts[c] ? c : 'all', query: '' });
          }) + '" class="hov-light" style="flex:1;min-width:200px;transform:skewX(-10deg);background:#fff;color:#002eff;border:2px solid #002eff;border-radius:5px;padding:12px 16px;font:700 16px ' + FC + ';text-transform:uppercase;letter-spacing:.05em;cursor:pointer">Comparer avec ma catégorie</button>' +
          '<button data-act="' + on(function () { goContact(buildSimSummary(cat, r), true); }) + '" class="hov-dark" style="flex:1;min-width:200px;transform:skewX(-10deg);background:#002eff;color:#fff;border:none;border-radius:5px;padding:12px 16px;font:700 16px ' + FC + ';text-transform:uppercase;letter-spacing:.05em;cursor:pointer">Nous contacter</button>' +
        '</div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
          '<button data-act="' + on(function () { st.simStep = cat && cat.questions.length ? 2 : 1; window.scrollTo(0, 0); render(); }) + '" style="flex:1;background:none;border:1px solid #c6cde8;color:#4a5180;border-radius:5px;padding:10px;font:600 14px \'Barlow\',sans-serif;cursor:pointer">← Modifier mes réponses</button>' +
          '<button data-act="' + on(function () { st.simStep = 1; st.simCat = null; st.answers = {}; window.scrollTo(0, 0); render(); }) + '" style="flex:1;background:none;border:1px solid #c6cde8;color:#4a5180;border-radius:5px;padding:10px;font:600 14px \'Barlow\',sans-serif;cursor:pointer">Autre catégorie</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Qui reçoit quoi ?                                                    */
  /* ------------------------------------------------------------------ */
  function catCounts() { var c = {}; DATA.forEach(function (d) { c[d.cat] = (c[d.cat] || 0) + 1; }); return c; }

  function renderExplore() {
    var counts = catCounts();
    var catOptions = [{ v: 'all', label: 'Toutes les catégories (' + DATA.length + ')' }].concat(Object.keys(counts).sort().map(function (c) { return { v: c, label: c + ' (' + counts[c] + ')' }; }));
    var list = DATA.filter(function (d) { return (st.catFilter === 'all' || d.cat === st.catFilter) && (!st.query || norm(d.nom).indexOf(norm(st.query)) !== -1); });
    var sk = st.sortKey;
    list = list.slice().sort(function (x, y) { return y[sk] - x[sk]; });
    var maxT = list.reduce(function (m, d) { return Math.max(m, d.t); }, 1);
    var fE = 0, fN = 0, fT = 0;
    list.forEach(function (d) { fE += d.e; fN += d.n; fT += d.t; });
    var sortBtn = function (onIt) { return 'border:none;padding:8px 15px;font:700 14px ' + FC + ';text-transform:uppercase;letter-spacing:.05em;cursor:pointer;' + (onIt ? 'background:#002eff;color:#fff' : 'background:#fff;color:#4a5180'); };

    var rows = list.map(function (d) {
      var open = st.expanded === d.nom;
      return '<div data-act="' + on(function () { set({ expanded: st.expanded === d.nom ? null : d.nom }); }) + '" class="hov-row" role="button" tabindex="0" aria-expanded="' + open + '" style="' + CARD + 'padding:12px 14px;cursor:pointer">' +
        '<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline">' +
          '<div style="font-weight:600;font-size:14.5px;line-height:1.35">' + esc(d.nom) + '</div>' +
          '<div style="font:800 19px ' + FC + ';font-style:italic;color:#000F9F;white-space:nowrap">' + eur(d.t) + '</div>' +
        '</div>' +
        '<div style="transform:skewX(-15deg);display:flex;height:10px;border-radius:2px;overflow:hidden;background:#eef0f8;margin:9px 3px 7px">' +
          '<div style="background:#002eff;transform-origin:left;animation:growX .5s ease both;width:' + (d.e / maxT * 100) + '%"></div>' +
          '<div style="background:' + GRAD + ';transform-origin:left;animation:growX .5s ease .1s both;width:' + (d.n / maxT * 100) + '%"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#6a71a0;flex-wrap:wrap">' +
          '<span>' + esc(d.cat) + '</span>' +
          '<span><span style="color:#002eff;font-weight:600">espèces ' + eur(d.e) + '</span> · <span style="color:#c2410c;font-weight:600">nature ' + eur(d.n) + '</span></span>' +
        '</div>' +
        (open ? '<div style="border-top:1px solid #eef0f8;margin-top:10px;padding-top:10px;font-size:13px;color:#3a4170;line-height:1.5"><div>' + esc(d.note) + '</div>' +
          (SHOW_CERT ? '<div style="margin-top:6px;font-size:12px;color:#6a71a0">Catégorisation&nbsp;: <strong>' + esc(d.cert) + '</strong> (analyse MR-CI sur base du budget communal)</div>' : '') + '</div>' : '') +
      '</div>';
    }).join('');

    return '<div data-screen="Qui reçoit quoi" style="max-width:880px;margin:0 auto;padding:30px 16px 56px">' +
      '<div style="display:flex;align-items:center;gap:12px">' + tag(true) + h1('Qui reçoit quoi&nbsp;?') + '</div>' +
      '<p style="font-size:14.5px;color:#4a5180;line-height:1.5;margin:10px 0 18px">Les ' + (DATA.length || 169) + ' associations soutenues par la Ville&nbsp;: subside en espèces et aides en nature (locaux, personnel, logistique) valorisées. Touchez une ligne pour le détail.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
        '<input id="explore-query" type="search" placeholder="Rechercher une association…" aria-label="Rechercher une association" value="' + esc(st.query) + '" data-input="' + on(function (e) { st.query = e.target.value; render(); }) + '" style="flex:2;min-width:200px;border:1px solid #c6cde8;border-radius:6px;padding:12px 14px;font-size:15px;background:#fff">' +
        '<select id="explore-cat" aria-label="Filtrer par catégorie" data-change="' + on(function (e) { set({ catFilter: e.target.value }); }) + '" style="flex:1;min-width:160px;border:1px solid #c6cde8;border-radius:6px;padding:12px;font-size:14px;background:#fff;color:#10143a">' +
          catOptions.map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === st.catFilter ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px">' +
        '<div style="' + CARD + 'padding:12px 14px;overflow:hidden;position:relative"><div style="position:absolute;top:0;left:0;right:0;height:4px;background:#002eff"></div>' +
          '<div style="font:700 13px ' + FC + ';color:#6a71a0;letter-spacing:.1em;margin-top:2px">EN ESPÈCES</div>' +
          '<div style="font:800 26px ' + FC + ';font-style:italic;color:#002eff;margin-top:2px;line-height:1">' + eur(Math.round(fE)) + '</div></div>' +
        '<div style="' + CARD + 'padding:12px 14px;overflow:hidden;position:relative"><div style="position:absolute;top:0;left:0;right:0;height:4px;background:' + GRAD + '"></div>' +
          '<div style="font:700 13px ' + FC + ';color:#6a71a0;letter-spacing:.1em;margin-top:2px">EN NATURE</div>' +
          '<div style="font:800 26px ' + FC + ';font-style:italic;color:#c2410c;margin-top:2px;line-height:1">' + eur(Math.round(fN)) + '</div></div>' +
        '<div style="background:#000F9F;border-radius:8px;padding:12px 14px;color:#fff;overflow:hidden;position:relative"><div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#002eff,#ff4fa0,#ffd35e)"></div>' +
          '<div style="font:700 13px ' + FC + ';color:#aab6ff;letter-spacing:.1em;margin-top:2px">TOTAL · ' + list.length + ' ASSOC.</div>' +
          '<div style="font:800 26px ' + FC + ';font-style:italic;margin-top:2px;line-height:1">' + eur(Math.round(fT)) + '</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:14px;align-items:center;font-size:12.5px;color:#4a5180;margin-bottom:14px;flex-wrap:wrap">' +
        '<span style="font:700 14px ' + FC + ';letter-spacing:.08em;text-transform:uppercase">Trier par</span>' +
        '<div style="display:flex;gap:0;border:1px solid #c6cde8;border-radius:6px;overflow:hidden;transform:skewX(-10deg)">' +
          '<button data-act="' + on(function () { set({ sortKey: 't' }); }) + '" style="' + sortBtn(sk === 't') + '">Total</button>' +
          '<button data-act="' + on(function () { set({ sortKey: 'e' }); }) + '" style="' + sortBtn(sk === 'e') + ';border-left:1px solid #c6cde8;border-right:1px solid #c6cde8">Espèces</button>' +
          '<button data-act="' + on(function () { set({ sortKey: 'n' }); }) + '" style="' + sortBtn(sk === 'n') + '">Nature</button>' +
        '</div>' +
        '<span style="display:flex;align-items:center;gap:6px;margin-left:auto"><span style="width:14px;height:10px;transform:skewX(-20deg);background:#002eff;display:inline-block"></span>Espèces</span>' +
        '<span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:10px;transform:skewX(-20deg);background:linear-gradient(90deg,#ff4fa0,#ffd35e);display:inline-block"></span>Nature</span>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' + (rows || '<div style="' + CARD + 'padding:18px;color:#6a71a0;text-align:center">Aucune association ne correspond à votre recherche.</div>') + '</div>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Contact                                                              */
  /* ------------------------------------------------------------------ */
  function goContact(msg, simContext) { go('contact', { cMsg: msg, cErr: '', simContext: !!simContext }); }

  function renderContact() {
    var field = function (id, label, type, key, required, extra) {
      return '<div><label for="' + id + '" style="font-size:13px;font-weight:700;display:block;margin-bottom:4px">' + label + ' ' + (required ? '<span style="color:#c22a1e">*</span>' : '<span style="color:#8a90b8;font-weight:500">(optionnel)</span>') + '</label>' +
        '<input id="' + id + '" type="' + type + '" ' + (extra || '') + ' value="' + esc(st[key]) + '" data-input="' + on(function (e) { st[key] = e.target.value; }) + '" style="width:100%;border:1px solid #c6cde8;border-radius:6px;padding:11px 12px;font-size:15px"></div>';
    };
    var subject = function () { return st.assoName && st.simContext ? 'Subsides Binche — dossier ' + st.assoName : 'Subsides de Binche — contact'; };
    var mailtoHref = function () {
      var body = st.cMsg + '\n—\n' + st.cPrenom + ' ' + st.cNom + '\n' + st.cEmail + (st.cTel ? '\n' + st.cTel : '');
      return 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject()) + '&body=' + encodeURIComponent(body);
    };
    var submit = function () {
      if (st.cSending) return;
      if (!st.cNom.trim() || !st.cPrenom.trim() || !st.cEmail.trim()) { set({ cErr: 'Nom, prénom et adresse e-mail sont obligatoires.' }); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.cEmail.trim())) { set({ cErr: "L'adresse e-mail ne semble pas valide." }); return; }
      if (st.cHoney) { set({ cSent: true }); return; } // robot : on fait semblant
      if (!FORM_ACCESS_KEY || !window.fetch) { st.cErr = ''; window.location.href = mailtoHref(); render(); return; }
      set({ cErr: '', cSending: true });
      var payload = {
        access_key: FORM_ACCESS_KEY,
        subject: subject(),
        from_name: 'Subsides de Binche — formulaire de contact',
        name: st.cPrenom.trim() + ' ' + st.cNom.trim(),
        email: st.cEmail.trim(),
        replyto: st.cEmail.trim(),
        telephone: st.cTel.trim() || '(non communiqué)',
        association: st.simContext && st.assoName ? st.assoName : '(hors simulation)',
        message: st.cMsg,
        botcheck: st.cHoney
      };
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
        .then(function (j) {
          if (j && j.success) { set({ cSending: false, cSent: true, cErr: '' }); window.scrollTo(0, 0); }
          else { set({ cSending: false, cErr: 'L\'envoi a échoué (' + esc((j && j.message) || 'erreur du service') + '). Réessayez ou utilisez le lien ci-dessous.' }); }
        })
        .catch(function () { set({ cSending: false, cErr: 'Impossible de joindre le service d\'envoi. Réessayez ou utilisez le lien ci-dessous.' }); });
    };
    if (st.cSent) {
      return '<div data-screen="Contact" style="max-width:640px;margin:0 auto;padding:30px 16px 56px">' +
        '<div style="display:flex;align-items:center;gap:12px">' + tag(true) + h1('Message envoyé') + '</div>' +
        '<div style="' + CARD + 'padding:22px;margin-top:16px;animation:rise .4s ease both">' +
          '<div style="font:800 24px ' + FC + ';font-style:italic;text-transform:uppercase;color:#000F9F;line-height:1.1">Merci ' + esc(st.cPrenom.trim()) + '&nbsp;!</div>' +
          '<p style="font-size:14.5px;color:#3a4170;line-height:1.55;margin:10px 0 0">Votre message a bien été transmis au groupe MR-CI. Nous vous répondons à <strong>' + esc(st.cEmail.trim()) + '</strong> sous quelques jours.</p>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:18px">' +
            skewBtn(on(function () { go('prop', { cSent: false, cMsg: '', cErr: '', simContext: false }); }), 'Découvrir la proposition du groupe MR-CI') +
          '</div>' +
        '</div></div>';
    }
    return '<div data-screen="Contact" style="max-width:640px;margin:0 auto;padding:30px 16px 56px">' +
      '<div style="display:flex;align-items:center;gap:12px">' + tag(true) + h1('Contacter le groupe MR-CI') + '</div>' +
      '<p style="font-size:14.5px;color:#4a5180;line-height:1.5;margin:10px 0 18px">Nous vérifions votre dossier et vous aidons à introduire la demande auprès de la Ville. Réponse sous quelques jours.</p>' +
      '<form data-submit="' + on(function (e) { e.preventDefault(); submit(); }) + '" novalidate style="' + CARD + 'padding:20px;display:flex;flex-direction:column;gap:14px;animation:rise .4s ease both">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">' +
          field('c-nom', 'Nom', 'text', 'cNom', true, 'autocomplete="family-name"') +
          field('c-prenom', 'Prénom', 'text', 'cPrenom', true, 'autocomplete="given-name"') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">' +
          field('c-email', 'Adresse e-mail', 'email', 'cEmail', true, 'autocomplete="email"') +
          field('c-tel', 'Téléphone', 'tel', 'cTel', false, 'autocomplete="tel"') +
        '</div>' +
        '<div><label for="c-msg" style="font-size:13px;font-weight:700;display:block;margin-bottom:4px">Votre message</label>' +
          '<textarea id="c-msg" rows="9" data-input="' + on(function (e) { st.cMsg = e.target.value; }) + '" style="width:100%;border:1px solid #c6cde8;border-radius:6px;padding:11px 12px;font-size:14px;line-height:1.5;resize:vertical">' + esc(st.cMsg) + '</textarea>' +
          (st.simContext ? '<div style="font-size:12px;color:#6a71a0;margin-top:4px">Pré-rempli avec votre simulation — vous pouvez le modifier.</div>' : '') +
        '</div>' +
        '<div style="position:absolute;left:-9999px;top:-9999px" aria-hidden="true"><label for="c-site">Ne pas remplir</label><input id="c-site" type="text" name="botcheck" tabindex="-1" autocomplete="off" value="' + esc(st.cHoney) + '" data-input="' + on(function (e) { st.cHoney = e.target.value; }) + '"></div>' +
        (st.cErr ? '<div role="alert" style="color:#c22a1e;font-size:13.5px;font-weight:600">' + st.cErr + '</div>' : '') +
        '<button type="submit" class="hov-dark" ' + (st.cSending ? 'disabled aria-busy="true"' : '') + ' style="transform:skewX(-10deg);background:#002eff;color:#fff;border:none;border-radius:5px;padding:13px 18px;font:700 17px ' + FC + ';text-transform:uppercase;letter-spacing:.06em;cursor:pointer;' + (st.cSending ? 'opacity:.7;cursor:progress' : '') + '">' + (st.cSending ? 'Envoi en cours…' : 'Envoyer au groupe MR-CI') + '</button>' +
        (FORM_ACCESS_KEY
          ? '<div style="font-size:12px;color:#8a90b8;line-height:1.5">Votre message est envoyé directement au groupe MR-CI (' + CONTACT_EMAIL + '). ' + (st.cErr ? '<a href="' + esc(mailtoHref()) + '" style="color:#002eff">Ouvrir plutôt mon application e-mail</a>.' : 'Vos coordonnées ne servent qu\'à vous répondre.') + '</div>'
          : '<div style="font-size:12px;color:#8a90b8;line-height:1.5">L\'envoi ouvre votre application e-mail avec le message prêt à partir vers ' + CONTACT_EMAIL + '.</div>') +
      '</form>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Proposition MR-CI                                                    */
  /* ------------------------------------------------------------------ */
  function renderProp() {
    var constat = function (t, d) { return '<div style="' + CARD + 'padding:16px"><strong style="color:#000F9F">' + t + '</strong><span style="color:#3a4170;font-size:14.5px;line-height:1.55"> ' + d + '</span></div>'; };
    var section = function (grad, title, inner, pad) {
      return '<section style="max-width:760px;margin:0 auto;padding:' + pad + '">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' + tagSm(grad) + h2(title) + '</div>' + inner + '</section>';
    };
    return '<div data-screen="Proposition MR-CI">' +
      '<section style="background:#000F9F;background-image:radial-gradient(720px 360px at 88% 118%,rgba(255,79,160,.30),transparent 62%),repeating-linear-gradient(115deg,rgba(255,255,255,.045) 0 2px,transparent 2px 120px);color:#fff;clip-path:polygon(0 0,100% 0,100% calc(100% - 26px),0 100%);padding-bottom:26px">' +
        '<div style="max-width:760px;margin:0 auto;padding:46px 16px 40px">' +
          '<div style="display:inline-block;transform:skewX(-10deg);background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.28);padding:6px 16px;font:700 13px ' + FC + ';letter-spacing:.14em;animation:rise .5s ease both">PROPOSITION DU GROUPE MR-CI</div>' +
          '<h1 style="font:800 clamp(34px,6.5vw,54px) ' + FC + ';font-style:italic;text-transform:uppercase;line-height:1;margin:16px 0 12px;text-wrap:pretty;animation:rise .5s ease .08s both">Un <span style="background:linear-gradient(90deg,#ff4fa0,#ff9d52 60%,#ffd35e);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#ffd35e">règlement unifié</span> des subsides communaux</h1>' +
          '<p style="font-size:16px;line-height:1.55;color:#ccd4ff;margin:0;animation:rise .5s ease .16s both">Soutenir la vie associative, c\'est bien. Le faire avec des règles claires, équitables et à jour, c\'est mieux. Voici ce que nous proposons au Conseil communal.</p>' +
        '</div>' +
      '</section>' +
      section(true, 'Le constat',
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          constat('Quatorze règlements juxtaposés.', 'Une association doit d\'abord deviner de quel règlement elle relève, puis en décoder les barèmes. Et pour les élus, contrôler qu\'un subside octroyé est bien réglementaire demande de croiser 14 textes différents.') +
          constat('Un règlement figé depuis 2009.', 'Les barèmes n\'ont plus bougé depuis 17 ans, et certains seuils sont encore d\'anciennes conversions de francs belges (1.239,47&nbsp;€, 24.789,35&nbsp;€).') +
          constat('Des anomalies jamais corrigées.', 'Un club sportif de 201 membres touche un subside de base inférieur à celui d\'un club de 15 membres&nbsp;; un camp scout de 14 participants ne donne droit à rien, un camp de 15 à 250&nbsp;€&nbsp;; une partie des subsides est fixée au budget sans aucun critère publié.') +
        '</div>', '30px 16px 10px') +
      section(false, 'Quatre principes pour la refonte',
        '<div style="display:flex;flex-direction:column;gap:8px">' + PROP_PRINCIPES.map(function (p) {
          return '<div style="' + CARD + 'padding:14px 16px;display:flex;gap:16px;align-items:baseline">' +
            '<span style="font:800 26px ' + FC + ';font-style:italic;background:linear-gradient(140deg,#002eff,#ff4fa0);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#002eff;flex-shrink:0;line-height:1">' + p.n + '</span>' +
            '<span style="font-size:14.5px;line-height:1.55;color:#3a4170"><strong style="color:#10143a">' + p.t + '</strong> ' + p.d + '</span></div>';
        }).join('') + '</div>', '26px 16px 10px') +
      section(true, 'Ce qui changerait',
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">' +
          '<div style="' + CARD + 'overflow:hidden"><div style="background:#eef0f8;padding:10px 16px;font:700 15px ' + FC + ';color:#4a5180;letter-spacing:.1em">AUJOURD\'HUI</div><div style="padding:8px 16px 14px">' +
            PROP_AVANT.map(function (t) { return '<div style="display:flex;gap:8px;padding:6px 0;font-size:14px;color:#3a4170;line-height:1.5"><span style="color:#b0b6d6">—</span><span>' + t + '</span></div>'; }).join('') + '</div></div>' +
          '<div style="background:#fff;border:2px solid #002eff;border-radius:8px;overflow:hidden"><div style="background:#002eff;padding:10px 16px;font:700 15px ' + FC + ';color:#fff;letter-spacing:.1em">AVEC LE RÈGLEMENT UNIFIÉ</div><div style="padding:8px 16px 14px">' +
            PROP_APRES.map(function (t) { return '<div style="display:flex;gap:8px;padding:6px 0;font-size:14px;color:#10143a;line-height:1.5"><span style="color:#002eff;font-weight:700">✓</span><span>' + t + '</span></div>'; }).join('') + '</div></div>' +
        '</div>' +
        '<div style="' + CARD + 'padding:18px;margin-top:18px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;position:relative;overflow:hidden">' +
          '<div style="position:absolute;left:0;top:0;bottom:0;width:7px;background:linear-gradient(180deg,#ff4fa0,#ffd35e)"></div>' +
          '<p style="flex:1;min-width:220px;font-size:14px;color:#3a4170;line-height:1.55;margin:0;padding-left:8px">Responsable d\'association, citoyen&nbsp;: votre avis nourrit la proposition avant son dépôt au Conseil communal.</p>' +
          skewBtn(on(function () { goContact('Bonjour,\n\nVoici ma réaction à la proposition de règlement unifié des subsides :\n\n', false); }), 'Réagir à la proposition', 'padding:12px 20px;letter-spacing:.05em') +
        '</div>', '26px 16px 46px') +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Toast                                                                */
  /* ------------------------------------------------------------------ */
  function renderToast() {
    var visible = st.toastReady && !st.toastDismissed && (st.screen === 'home' || st.screen === 'explore');
    if (!visible) return '';
    return '<div style="position:fixed;bottom:16px;right:16px;left:16px;z-index:50;display:flex;justify-content:end;pointer-events:none">' +
      '<div role="status" style="pointer-events:auto;background:#fff;border:1px solid #e3e6f2;border-radius:6px;box-shadow:0 10px 30px rgba(13,17,48,.22);padding:14px 16px;max-width:350px;display:flex;gap:12px;align-items:start;transform:skewX(-6deg);animation:toastIn .45s ease both;position:relative;overflow:hidden">' +
        '<div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,#ff4fa0,#ffd35e)"></div>' +
        '<div style="flex:1;transform:skewX(6deg);padding-left:6px">' +
          '<div style="font:700 17px ' + FC + ';font-style:italic;text-transform:uppercase;color:#000F9F;line-height:1.15">Découvrez la proposition du groupe MR-CI pour plus de transparence</div>' +
          '<button data-act="' + on(function () { st.toastDismissed = true; try { sessionStorage.setItem('mrciToastDismissed', '1'); } catch (e) {} go('prop'); }) + '" class="hov-dark" style="margin-top:9px;background:#002eff;color:#fff;border:none;border-radius:4px;padding:8px 14px;font:700 14px ' + FC + ';text-transform:uppercase;letter-spacing:.05em;cursor:pointer">Lire la proposition</button>' +
        '</div>' +
        '<button data-act="' + on(dismissToast) + '" aria-label="Fermer" class="hov-x" style="background:none;border:none;color:#8a90b8;font-size:18px;line-height:1;cursor:pointer;padding:2px;transform:skewX(6deg)">×</button>' +
      '</div>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Rendu principal                                                      */
  /* ------------------------------------------------------------------ */
  var SCREENS = { home: renderHome, sim: renderSim, explore: renderExplore, prop: renderProp, contact: renderContact };
  var TITLES = { home: 'Subsides de Binche — Où vont les subsides communaux ?', sim: 'Tester mes droits — Subsides de Binche', explore: 'Qui reçoit quoi ? — Subsides de Binche', prop: 'Proposition MR-CI — Subsides de Binche', contact: 'Contact — Subsides de Binche' };

  function render() {
    handlers = {}; hid = 0;
    // Mémorise le champ actif pour le restaurer après re-rendu (recherche, nom…)
    var ae = document.activeElement, focusId = ae && ae.id && app.contains(ae) ? ae.id : null;
    var selStart = null;
    if (focusId && typeof ae.selectionStart === 'number') { try { selStart = ae.selectionStart; } catch (e) {} }
    app.innerHTML = renderHeader() + '<main id="main">' + SCREENS[st.screen]() + '</main>' + renderToast() + renderFooter();
    document.title = TITLES[st.screen] || TITLES.home;
    if (focusId) {
      var el = document.getElementById(focusId);
      if (el) { el.focus({ preventScroll: true }); if (selStart != null) { try { el.setSelectionRange(selStart, selStart); } catch (e) {} } }
    }
  }

  /* Délégation d'événements */
  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t || !app.contains(t)) return;
    var fn = handlers[t.getAttribute('data-act')];
    if (fn) { if (t.tagName === 'A') e.preventDefault(); fn(e); }
  });
  app.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
  });
  app.addEventListener('input', function (e) {
    var t = e.target.closest('[data-input]');
    if (!t) return;
    var fn = handlers[t.getAttribute('data-input')];
    if (fn) fn(e);
  });
  app.addEventListener('change', function (e) {
    var t = e.target.closest('[data-change]');
    if (!t) return;
    var fn = handlers[t.getAttribute('data-change')];
    if (fn) fn(e);
  });
  app.addEventListener('submit', function (e) {
    var t = e.target.closest('[data-submit]');
    if (!t) return;
    var fn = handlers[t.getAttribute('data-submit')];
    if (fn) fn(e); else e.preventDefault();
  });
  window.addEventListener('hashchange', function () {
    if (suppressHash) { suppressHash = false; return; }
    var s = screenFromHash();
    if (s !== st.screen) { st.screen = s; window.scrollTo(0, 0); render(); }
  });

  /* Démarrage */
  function boot() {
    if (!window.SUBS_DATA || !window.SIM) { setTimeout(boot, 50); return; }
    S = window.SIM; DATA = window.SUBS_DATA; eur = S.eur;
    st.screen = screenFromHash();
    var dismissed = false;
    try { dismissed = sessionStorage.getItem('mrciToastDismissed') === '1'; } catch (e) {}
    if (!dismissed) setTimeout(function () { st.toastReady = true; render(); }, 20000);
    render();
  }
  boot();
})();
