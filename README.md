# Subsides communaux — Ville de Binche

Moteur de règles et simulateur des subsides communaux octroyés aux associations
de la Ville de Binche, basé sur le règlement général (CC 12/10/2009) et les
règlements spécifiques par catégorie.

## Site

Site statique (HTML/CSS/JS, sans build) publié via GitHub Pages :
**https://jeangigounon.github.io/subsides-binche/**

- `index.html` — coquille de la page unique
- `assets/app.js` — application (5 écrans : Accueil, Tester mes droits, Qui reçoit
  quoi ?, Proposition MR-CI, Contact ; routage par `#/…`)
- `assets/sim-rules.js` — moteur de calcul par catégorie (dérivé de `regles.json`)
- `assets/data.js` — associations subsidiées (`SUBS_DATA`, `SUBS_RULES`, `SUBS_PUBLIC`)
- `assets/style.css`, `assets/logo-mrci.png`
- `design/` — prototype Claude Design d'origine (référence visuelle, non exécutable seul)

Pour tester en local : `python -m http.server 8000` puis http://localhost:8000/

## Contenu

- `regles.json` — moteur de règles : conditions générales d'éligibilité, obligations,
  et pour chacune des 14 catégories d'associations les questions à poser et les
  formules de calcul du subside (avec références aux articles).
- `règlements/` — sources officielles : règlement général, 13 règlements spécifiques
  (PDF) et les formulaires de demande (DOCX).
- `assets/data.js` — données des subsides effectivement octroyés par association
  (récupérées de l'ancien site *jeangigounon/subsides*).

> Simulation indicative : seule la décision du Conseil communal fait foi.
