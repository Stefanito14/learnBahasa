# Spec — Chantier n°4 : Parcours guidé (fil de mini-leçons)

**Date :** 2026-06-24
**Projet :** Bahasa Indonesia — `index.html`
**Problème :** la checklist de jalons actuelle dit *quoi* valider mais pas *où aller ni quoi faire*. On veut un parcours qui guide : pour chaque étape, savoir où aller sur le site et quoi y faire.

## Objectif
Transformer l'onglet **Parcours** en un **fil de mini-leçons** guidées. Chaque leçon = un objectif court + des étapes concrètes qui pointent (lien profond) vers le bon endroit du site, avec une consigne. Une leçon est mise en avant comme « à faire maintenant ».

## Décisions verrouillées (brainstorming)
- Forme : **fil guidé étape par étape** (l'option « items actionnables » en est le mécanisme de base).
- Squelette : **nouvelle séquence de mini-leçons**, indépendante du calendrier.
- Les leçons **orchestrent le contenu existant** (flashcards, quiz, dialogues, grammaire, drills, prononciation, carnet) + un liant court écrit. Pas de nouveau cours réécrit.
- Le fil **devient le Parcours principal** : la **checklist de jalons est retirée**. Le **calendrier 36 semaines** reste en « vue d'ensemble » repliable. Les blocs **« Je peux… »** restent (bilans de fin de phase).
- Parcours **souple** (pas verrouillé) : la prochaine leçon est mise en avant, mais toutes les leçons sont cliquables.
- Validation **manuelle** (« Marquer comme fait »).
- **Découpage** : ce chantier livre le **moteur + les leçons de la Phase 1**. Les leçons des Phases 2 et 3 seront ajoutées dans des passes suivantes.

## Non-objectifs
- Validation auto-détectée (via SRS/quiz) — éventuelle v2.
- Verrouillage strict des leçons.
- Leçons des Phases 2 & 3 (chantiers suivants ; le moteur les accueillera sans changement).

---

## Design

### 1. Modèle de données d'une leçon
Tableau `LESSONS` (dans `data.js`, à côté du reste), ordonné. Chaque leçon :
```
{
  id: "p1-l2",                      // identifiant stable
  phase: 1,
  title: "Bonjour & merci",
  goal: "Saluer poliment et remercier dans toutes les situations.",
  steps: [
    { text: "Apprends les cartes du thème Salutations & politesse.",
      target: { tab: "vocab", theme: "Salutations & politesse" } },
    { text: "Lis les phrases de l'essentiel à voix haute.",
      target: { tab: "phrases" } },
    { text: "Teste-toi : 5 questions du quiz de vocabulaire.",
      target: { tab: "training", anchor: "quiz-voc" } }
  ],
  tip: "…"   // optionnel
}
```

**Contrat `target`** : `{ tab: "<data-tab>", theme?: "<thème flashcards>", anchor?: "<id d'élément>" }`.

### 2. Lien profond — `goTo(target)`
Fonction dans la page :
1. `activateTab(target.tab)` (réutilise la nav existante).
2. Si `target.theme` : sélectionne le bon chip de thème dans les flashcards (clic programmatique sur le `#flash-filter .chip` correspondant).
3. Si `target.anchor` : `document.getElementById(anchor).scrollIntoView({behavior:"smooth"})` (léger délai après le switch d'onglet pour laisser le panneau s'afficher).
Ancres nécessaires : la plupart existent déjà (`quiz-num`, `quiz-voc`, `quiz-listen`, `drill-mount`, `dialogues-mount`, `flashcard`). On ajoutera une ancre `shadowing` à la section shadowing de Prononciation. Les onglets sans ancre précise se contentent du switch d'onglet.

### 3. Progression
- Stockage : clé `Store` **`lessons`** = `{ "<id>": "done" }` (JSON, parse sous try/catch → `{}`).
- `lessonDone(id)` : marque/dé-marque, persiste, rafraîchit l'UI + l'encart « prochaine leçon ».
- **Prochaine leçon** = la première leçon (dans l'ordre) non faite (toutes phases confondues parmi les leçons définies).
- Logique pure isolée dans **`parcours-core.js`** (UMD, testée) :
  - `nextLessonId(orderedIds, doneMap) -> string|null`
  - `lessonsProgress(orderedIds, doneMap) -> {done, total, pct}`
  - `isLessonDone(doneMap, id) -> boolean`

### 4. UI — onglet Parcours
- **En haut : « Ton fil guidé ».** Encart « ▶ Prochaine leçon : <titre> » (bouton qui déplie/scrolle vers elle).
- **Liste des leçons** groupées par phase. Phase 1 active ; Phases 2 & 3 affichent une pastille « Bientôt » (placeholder, pas d'étapes). Chaque leçon = une carte :
  - état : ✓ faite · ▶ à faire maintenant · ○ à venir (toutes cliquables).
  - dépliable → montre `goal` + les `steps`, chacune avec sa consigne et un bouton **« → Aller »** (`goTo`).
  - bouton **« ✓ Marquer comme fait »** (toggle).
- **Retiré** : l'ancienne checklist de jalons (`data-phase="p1/p2/p3"` blocs) — supprimée du HTML.
- **Conservé** : le **calendrier 36 semaines** (déplacé sous un `<details>` « Vue d'ensemble · 36 semaines », replié par défaut) et les blocs **« Je peux… »** (inchangés).

### 5. Accueil
- La tuile/jauge « % parcours validé » compte aujourd'hui toutes les `.task`. En retirant les jalons, elle comptera **naturellement les seules cases « Je peux… »** (15 compétences) — ce qui en fait une jauge de compétences cohérente. Aucun changement de logique requis ; vérifier juste le libellé (`/15`).
- Ajout d'un **encart « Prochaine leçon : <titre> »** sur l'accueil (clic → onglet Parcours), alimenté par `nextLessonId`.

### 6. Leçons de la Phase 1 (contenu à livrer dans ce chantier)
7 mini-leçons (A1), orchestrant l'existant :

1. **Les sons de la langue** — *lire l'indonésien à voix haute sans bloquer.* → Prononciation (voyelles/consonnes, écoute) ; Prononciation ▸ shadowing (répète 4 phrases).
2. **Bonjour & merci** — *saluer et remercier.* → Flashcards « Salutations & politesse » ; Phrases « L'essentiel » ; Quiz vocab.
3. **Te présenter** — *dire nom, origine, métier.* → Flashcards « Personnes & famille » ; Grammaire « ossature de la phrase » ; Phrases « Sympathiser » ; Carnet (prompt « Présente-toi », à dire à voix haute).
4. **Compter & les prix** — *nombres + dire/comprendre un prix.* → Flashcards « Nombres » ; Quiz nombres ; Flashcards « Argent & marché » ; Phrases « Se débrouiller ».
5. **Commander à manger** — *commander simplement, sans piment.* → Flashcards « Nourriture & boisson » ; Drill « Saya mau ___ » ; Dialogue « Commander au warung ».
6. **Dire non & poser des questions** — *nier correctement + 5 mots interrogatifs.* → Grammaire « dire non » ; Grammaire « poser des questions » ; Drill « Di mana ___ ? ».
7. **Présent, passé, futur (sans conjugaison)** — *situer dans le temps avec sudah/sedang/akan.* → Grammaire « le temps sans conjugaison » ; Flashcards « Temps » ; Drill « Saya sudah ___ » ; Carnet (prompt « Raconte ta journée d'hier »).

## Vérification
- **Tests unitaires** (`node:test`) sur `parcours-core.js` : `nextLessonId` (première non faite ; null si toutes faites), `lessonsProgress` (done/total/pct, arrondi), `isLessonDone`.
- **Navigateur (manuel)** : « → Aller » ouvre le bon onglet (et pré-sélectionne le bon thème de flashcards / scrolle à la bonne ancre) ; « Marquer comme fait » met à jour l'état + l'encart « prochaine leçon » (accueil & parcours) ; le calendrier est replié ; les jalons ont disparu ; la jauge accueil compte les « Je peux… ».

## Risques & parades
| Risque | Parade |
|---|---|
| `lessons`/`target` corrompu | parse `try/catch` → `{}` ; `goTo` ignore une ancre/thème introuvable sans planter |
| Scroll avant l'affichage du panneau | petit `setTimeout` après `activateTab` avant `scrollIntoView` |
| Jauge accueil incohérente après retrait des jalons | vérifier qu'elle compte bien les 15 « Je peux… » (`/15`) |
| Thème de flashcards renommé | `goTo` compare au libellé exact du chip ; si absent, switch d'onglet seul |

## Hors périmètre / plus tard
- Leçons Phases 2 & 3.
- Validation automatique via progression SRS/quiz.
- Verrouillage / déblocage progressif.
