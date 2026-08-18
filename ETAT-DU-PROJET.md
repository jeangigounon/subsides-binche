# État du projet « Subsides Binche » — document de passation

> Rédigé le 17 août 2026, mis à jour le 18 août 2026, pour transmettre le contexte à une autre IA / un autre agent
> chargé de définir les prochaines étapes. Tout ce qui est décrit ici est déjà fait,
> versionné et poussé sur GitHub.

---

## 1. Objectif du projet

Construire un **simulateur des subsides communaux** de la Ville de Binche (Belgique)
destiné aux associations locales : à partir de quelques questions (catégorie
d'association, nombre de membres, activités, statut juridique…), le simulateur doit
indiquer si l'association est éligible et **estimer le montant du subside annuel**
auquel elle peut prétendre, avec les références aux articles des règlements communaux.

Contexte politique : projet porté par le groupe **MR-CI Binche** (opposition
communale), dans une logique de transparence (« qui reçoit quoi ») et d'aide aux
associations (« pouvez-vous en bénéficier ? »). L'utilisateur est Jean Gigounon
(jean.gigounon@mr.be).

Une première version de site existe déjà (voir §4) ; la décision prise le 17/08/2026
est de **repartir de zéro** en ne récupérant que les données `assets/data.js`.

---

## 2. Environnement technique

- Poste Windows 11, **sans droits administrateur**.
- git 2.54 configuré (Jean Gigounon / jean.gigounon@mr.be).
- GitHub CLI `gh` 2.97 installé en scope utilisateur (winget `--scope user`), copié
  dans `C:\Users\JeanGigounon\bin\gh.exe` (dans le PATH). Authentifié sur le compte
  GitHub **`jeangigounon`** (HTTPS, scopes `repo`, `read:org`, `gist`) ; git utilise
  `gh` comme credential helper → push/pull fonctionnent sans mot de passe.
- Python 3.12 disponible. Pas de Node installé pour l'instant (à vérifier avant
  d'imposer un outillage JS lourd).
- Dossier de travail local : `C:\dev\subsides binche` (dépôt git, branche `main`).

---

## 3. Dépôt GitHub actif : `jeangigounon/subsides-binche`

- URL : https://github.com/jeangigounon/subsides-binche (**public** depuis le 18/08/2026).
- **Site publié via GitHub Pages : https://jeangigounon.github.io/subsides-binche/** (branche `main`, racine).
- Remote `origin` configuré localement.

### Arborescence

```
subsides binche/
├── README.md
├── ETAT-DU-PROJET.md          ← ce document
├── .gitignore
├── index.html                 ← coquille du site (page unique)
├── regles.json                ← moteur de règles JSON (v1.1, ~33 Ko)
├── assets/
│   ├── app.js                 ← application vanilla JS (rendu des 5 écrans, routage #/…)
│   ├── style.css              ← CSS de base + classes de survol
│   ├── sim-rules.js           ← moteur de calcul par catégorie (window.SIM), issu du design
│   ├── data.js                ← données récupérées de l'ancien site (46 Ko)
│   └── logo-mrci.png
├── design/                    ← prototype Claude Design d'origine (référence, non exécutable seul)
│   ├── Subsides Binche v2.dc.html  (design principal transposé)
│   ├── Subsides Binche.dc.html     (v1)
│   ├── support.js                  (runtime dc)
│   └── README-claude-design.md
└── règlements/                ← sources officielles (~4 Mo)
    ├── Règlement général fixant les conditions d'octroi d'un subside communal … .pdf
    ├── Règlement subside spécifique aux associations culturelles locales.pdf
    ├── … aux associations de personnes âgées.pdf
    ├── … aux associations sportives locales.pdf
    ├── … aux cercles horticoles et petit élevage.pdf
    ├── … aux clubs de photos, cinés, vidéos.pdf
    ├── … aux comités organisateurs de kermesses communales.pdf
    ├── … aux oeuvres d'aide aux handicapés.pdf
    ├── … aux organisations de jeunesse.pdf
    ├── … aux sections locales de l'ONE.pdf
    ├── … aux sociétés carnavalesques.pdf
    ├── … aux sociétés musicales et aux chorales.pdf
    ├── … aux sociétés ornithologiques.pdf
    ├── … aux sociétés patriotiques.pdf
    ├── FORMULAIRE NOUVELLE DEMANDE AGREATION.docx
    ├── Formulaire espèce (1).docx
    ├── 2026 - LETTRE association - point.docx
    ├── 2026 - Tableau justificatif de l'utilisation du subside (annexe 1) point.docx
    ├── Annexe - Groupement de jeunesse.docx
    └── Annexe - Fiche activités - Clubs sportifs.docx
```

### 3.0 Le site (`index.html`, `assets/app.js`)

Transposition fidèle du prototype Claude Design « Subsides Binche v2 » (fourni par
l'utilisateur le 18/08/2026 sous forme de zip) en site statique sans dépendance :
HTML/CSS/JS vanilla, polices Google Fonts (Barlow / Barlow Condensed), rendu par
`innerHTML` avec délégation d'événements, état en mémoire, routage par hash
(`#/simulateur`, `#/qui-recoit-quoi`, `#/proposition`, `#/contact`).

Écrans : **Accueil** (chiffres clés calculés depuis `SUBS_DATA`), **Tester mes droits**
(3 étapes : nom + catégorie → questions dynamiques bool/number/enum/liste avec
conditions `visible` → résultat détaillé, notes, conditions générales, avertissement,
boutons « Comparer avec ma catégorie » et « Nous contacter » pré-rempli),
**Qui reçoit quoi ?** (recherche insensible aux accents, filtre catégorie, tri, KPI,
lignes dépliables), **Proposition MR-CI**, **Contact** (validation, envoi via `mailto:`
vers `CONTACT_EMAIL` = mr-ci.binche@gmail.com, constante en tête de `app.js`).
Toast « proposition MR-CI » après 20 s sur Accueil/Explorer (mémorisé en sessionStorage).

Le calcul des montants est fait par `assets/sim-rules.js` (objet `window.SIM` :
`cats[]` avec `questions[]` et `compute(answers)` → `{lines, notes, ineligible?,
nominatif?}`), **pas** directement par `regles.json` (qui reste la source documentaire
structurée). Testé dans Chrome : sportives 1 605 €, jeunesse 561 €, aucune erreur console.

### 3.1 `regles.json` — moteur de règles (v1.1)

Fichier JSON structuré, rédigé à partir des règlements PDF. Structure :

```
{
  "meta": { titre, version, sources[], avertissement, devise },
  "conditions_generales": {
    "ref": "Règlement général, CC 12/10/2009 pt 19",
    "eligibilite": [ {id, texte, articles[]} … ],   // agréation, intérêt général, siège,
                                                    // ouverture à tous, ≥1 an d'existence,
                                                    // compte bancaire propre
    "obligations": [ {id, texte, articles[]} … ],   // demande annuelle, délai 30 j,
                                                    // justification 90 j, mention
                                                    // « avec le soutien de la Ville », usage conforme
    "seuils_comptables": [ {plage:[min,max], obligation, articles[]} … ],
                                                    // 0–1 239,47 € / 1 239,47–24 789,35 € / > 24 789,35 €
    "tutelle": { seuil: 2500, texte, articles[] },
    "types_aide": { especes, nature, aides_negligeables }
  },
  "categories": [ … 14 catégories … ]
}
```

Chaque catégorie a la forme :

```
{
  "id", "label", "ref" (décision du Conseil communal), "imputation" (article budgétaire),
  "definition" (optionnel),
  "questions": [ { id, type: "number"|"bool"|"enum", libelle, max?, valeurs? } … ],
  "calcul": { "type": …, … },
  // optionnels : "ponctuel" (subside exceptionnel : max % budget, plafond),
  //              "elite" (sportives), "conditions_specifiques" (kermesses),
  //              "note_historique" (carnavalesques)
}
```

Types de calcul rencontrés :

| `calcul.type`      | Sens                                                                                   | Catégories                                              |
|--------------------|----------------------------------------------------------------------------------------|---------------------------------------------------------|
| `forfait`          | Montant fixe annuel                                                                    | aines (155 €), horticoles (155 €), photo_cine (125 €), handicap (125 €), ornithologiques |
| `bareme_exclusif`  | Liste de `regles[]` `{si:{…}, montant, libelle, article}` ; **la première règle dont la condition `si` est satisfaite s'applique** (règle vide `{}` = défaut) | culturelles, one, musicales, patriotiques, kermesses     |
| `cumulatif`        | `composantes[]` additionnées ; chaque composante a soit des `regles[]` (barème), soit une `formule` (expression arithmétique sur les ids de questions, avec `max` par question) | sportives, jeunesse                                     |
| `bareme_2019`      | Barème spécifique sociétés carnavalesques (modif. CC 19/02/2019)                        | carnavalesques                                          |
| `nominatif`        | Pas de barème : montant fixé au budget par le Conseil communal ; le simulateur renvoie vers la comparaison avec les subsides existants | nominatif                                               |

Liste des 14 catégories (`id` → label, référence) :

1. `culturelles` — Associations culturelles locales (CC 12/10/2009 pt 24) : 200 € sans
   personnalité juridique / 400 € avec / 4 500 € si propriétaire de ses installations ;
   ponctuel possible (max 50 % du budget, plafond 1 600 €).
2. `sportives` — Associations sportives locales (pt 25) : cumul base membres (65 € ≤200
   membres, 50 € au-delà) + activités (65/130/100/165 € selon type, plafonnées) +
   équipes en championnat + spécificités par discipline (basket, football URBSFA,
   mini-foot, marche, tennis de table…) + infrastructures privées ; volet « élite ».
3. `jeunesse` — Organisations de jeunesse (pt 23) : 186 €/an + jusqu'à 500 € par camp.
4. `aines` — Associations de personnes âgées (pt 31) : forfait 155 €.
5. `horticoles` — Cercles horticoles et petit élevage (pt 32) : forfait 155 €.
6. `photo_cine` — Clubs photo, ciné, vidéo (pt 27) : forfait 125 €.
7. `handicap` — Œuvres d'aide aux handicapés (pt 33) : forfait 125 €.
8. `ornithologiques` — Sociétés ornithologiques (pt 28) : forfait.
9. `one` — Sections locales de l'ONE (pt 30) : 186 € ou 297 €.
10. `musicales` — Sociétés musicales et chorales (pt 26) : barème.
11. `patriotiques` — Sociétés patriotiques (pt 29, modifié CC 20/12/2016 pt 20) : barème.
12. `kermesses` — Comités organisateurs de kermesses communales (pt 22, modifié CC
    19/02/2019 pt 13) : 375 € à 2 000 € selon la durée ; conditions spécifiques.
13. `carnavalesques` — Sociétés carnavalesques (pt 34, modifié CC 19/02/2019 pt 12) :
    700 € à 3 000 € selon le type de société (gilles, fantaisie, paysans, pierrots…).
14. `nominatif` — Subsides nominatifs hors barème (règlement général art. 22).

⚠️ `regles.json` n'a **pas encore été validé** ligne à ligne contre les PDF par une
relecture indépendante, ni exécuté par un moteur : c'est une transcription structurée
faite en une passe. Une étape de vérification (croiser chaque montant/condition avec le
PDF source, tester des cas types) est recommandée avant de bâtir l'interface dessus.

### 3.2 `assets/data.js` — données de l'ancien site

Fichier JS qui déclare trois globales :

- `window.SUBS_DATA` : tableau de **169 associations** effectivement subsidiées par
  la Ville (exercice récent), champs `{nom, cat, e (espèces €), n (nature €),
  t (total €), cert ("Confirmé"|"Probable"|"À confirmer"), note}`.
  Répartition : 45 sociétés carnavalesques, 31 sportives, 28 culturelles, 23 hors
  barème/nominatif, 7 jeunesse, 7 patriotiques, 7 musicales, 6 kermesses, 5 aînés,
  4 ONE, 3 horticoles, 2 photo/ciné, 1 ornithologique. Totaux ≈ 223 513 € en espèces
  et ≈ 114 070 € en nature. (132 confirmés, 21 probables, 16 à confirmer.)
- `window.SUBS_RULES` : par catégorie, résumé textuel `{ref, montants[[libellé,
  montant]], regles[], imput}` — version « lisible » des règlements (redondant avec
  `regles.json`, mais utile pour l'affichage).
- `window.SUBS_PUBLIC` : par catégorie, `{icon (emoji), pour (phrase « vous êtes… »),
  montant (fourchette lisible)}` — textes grand public.

Les libellés de catégorie de `data.js` (« Organisation de jeunesse », « Personnes
âgées », « HORS BARÈME — Subside nominatif »…) **ne correspondent pas aux `id` de
`regles.json`** : une table de correspondance sera nécessaire.

---

## 4. Ancien dépôt `jeangigounon/subsides` (archive, NE PAS MODIFIER sans demande)

- Public, créé fin juin 2026, site statique **encore en ligne** via GitHub Pages :
  https://jeangigounon.github.io/subsides/
- Contenu : `index.html` (accueil « À qui la Ville de Binche donne-t-elle de
  l'argent ? »), `explorer.html` (explorateur des subsides par association/catégorie),
  `associations.html` (espace associations avec fenêtre de conditions), `assets/`
  (`app.js`, `common.css`, `data.js`, `fonts.css` avec police Fieldwork embarquée,
  charte MR bleu « royal/digital »).
- Décision utilisateur (17/08/2026) : on repart de zéro, seul `assets/data.js` a été
  repris. L'ancien site reste en ligne tant que le nouveau n'est pas prêt ; à terme il
  faudra décider de le remplacer (pousser le nouveau site dans ce dépôt / rediriger) ou
  de l'archiver.

---

## 5. Historique des échanges (résumé)

1. **16/08/2026** — Dépôt des règlements PDF/DOCX dans `règlements/` et rédaction de
   `regles.json` (moteur de règles). Demande de connexion à GitHub : `gh` non installé,
   pas de droits admin.
2. **17/08/2026** — Installation de `gh` en scope utilisateur (le MSI système a échoué,
   code 1602, faute d'admin). Authentification `gh auth login` via navigateur réussie
   (compte `jeangigounon`). Récupération de `assets/data.js` de l'ancien dépôt.
   `git init`, création du dépôt privé `subsides-binche`, premier push. Rédaction de ce
   document.
3. **18/08/2026** — L'utilisateur a produit un design complet avec Claude Design
   (claude.ai/design) et l'a déposé en zip. `regles.json` mis à jour en v1.1 par une
   autre IA. Transposition du design en site statique (`index.html`, `assets/app.js`,
   `assets/style.css`), tests dans Chrome, push, passage du dépôt en public et
   activation de GitHub Pages → site en ligne.

---

## 6. Ce qui reste à faire (état des lieux, sans ordre imposé)

Le site est en ligne et fonctionnel. Points ouverts :

- **Valider les barèmes** de `sim-rules.js` et de `regles.json` contre les PDF
  (montants, conditions, articles) ; garder les deux fichiers cohérents (aujourd'hui
  `sim-rules.js` est la vérité pour le calcul, `regles.json` la documentation).
- **Jeu de tests** : comparer les montants simulés aux montants réels de `SUBS_DATA`
  pour quelques associations connues.
- **Contenu** : confirmer l'adresse de contact (`CONTACT_EMAIL`), les textes de la
  proposition MR-CI, éventuellement lier les formulaires DOCX depuis le résultat.
- **Ancien site** `jeangigounon.github.io/subsides/` : à rediriger vers le nouveau ou à
  archiver.
- **Améliorations possibles** : `SHOW_CERT` (afficher le niveau de certitude de la
  catégorisation), page 404, partage social (image og:image), analytics respectueux,
  vérification accessibilité mobile.
- Éventuellement : mise à jour des barèmes (indexation ? nouvelles décisions du Conseil
  après 2019 ?) — à vérifier auprès de la Ville.
