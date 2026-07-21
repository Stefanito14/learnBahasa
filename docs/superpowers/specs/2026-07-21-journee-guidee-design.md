# Spec — « Ta journée » : Challenge guidé (redesign UX)

**Date :** 2026-07-21
**Projet :** Bahasa Indonesia — `index.html`
**Problème :** le mode Challenge 75 livré est un **tracker abstrait** (5 anneaux gris « coche tes piliers ») qui ne dit pas *quoi faire*. À zéro, l'onglet et l'encart d'accueil paraissent vides et cryptiques. On veut transformer le Challenge en **QG quotidien guidé** : « voilà ta journée, clique, c'est parti ».

## Objectif
Faire du Challenge un **plan du jour concret et actionnable** : chaque jour, 5 tâches (une par pilier), tirées de la **leçon du jour** ou de la **consolidation**, chacune cliquable (lien profond) et cochable. Faire les tâches remplit les piliers → journée pleine. La gamification (streak, grille 75, badges) reste, mais **condensée** derrière l'action du jour.

## Décisions verrouillées (brainstorming)
- **Challenge = ta journée guidée (fusion).** Le Challenge devient le tableau de bord quotidien.
- **Journée calée sur la leçon du jour** : cœur = la prochaine mini-leçon du Parcours ; autour = SRS + prompts Parler/Journal.
- **Parcours = la carte, Challenge = aujourd'hui.** Le Parcours reste la vue d'ensemble du fil (toutes les leçons, phases). Le Challenge n'affiche que la journée. Rôles complémentaires, pas de doublon.
- **Jours sans nouvelle leçon → mode consolidation** : SRS dues + révision d'un thème vu + prompts. Le Challenge guide toujours. « Journée pleine » = les 5 piliers couverts (**moteur `challenge-core.js` inchangé**).
- **Layout Challenge** : plan du jour en **héros** ; streak + XP en fine barre ; grille 75 + badges + XP total repliés sous `▸ Voir ma progression` (`<details>`).
- **Accueil** : une carte **« Ta journée »** avec CTA `Continuer →`, qui **remplace** l'encart à ronds *et* l'encart « prochaine leçon ».

## Non-objectifs
- Réécrire le contenu des leçons ; ajouter les leçons des Phases 2 & 3.
- Modifier le moteur des piliers/streak/grille/badges (`challenge-core.js` reste tel quel).
- Notifications / rappels quotidiens.
- Personnalisation du plan par l'utilisateur.

---

## Design

### 1. Modèle « plan du jour »
Chaque jour = **exactement 5 tâches, une par pilier**, dans l'ordre figé `["study","read","listen","speak","journal"]` (libellés FR : Étudier / Lire / Écouter / Parler / Journal).

Pour chaque pilier :
- s'il existe une **étape de la leçon du jour** taguée avec ce pilier → tâche = cette étape (son `text` + son `target` pour le lien profond) ;
- sinon → **tâche par défaut** (consolidation) :
  - **Lire** : « Révise tes cartes dues » (N) → SRS (flashcards / carnet SRS).
  - **Écouter** : « Quiz d'écoute (5) » → `training` ancre `quiz-listen`.
  - **Étudier** : « Relis un point de grammaire » → `grammaire`.
  - **Parler** : un prompt d'expression tiré du pool existant → `carnet` (prompts).
  - **Journal** : « Écris 2 phrases (journal) » → `carnet`.

« Leçon du jour » = `ParcoursCore.nextLessonId(LESSON_IDS, lessonsState)`. Si `null` (fil épuisé) → **mode consolidation** : les 5 tâches sont toutes des tâches par défaut, titre = « Consolidation ».

### 2. Logique pure — `journee-core.js` (UMD, testé)
Même patron que les autres cores. Aucune dépendance DOM.
```
PILLAR_LABELS = { study:"Étudier", read:"Lire", listen:"Écouter", speak:"Parler", journal:"Journal" }

pillarForStep(step) -> "study"|"read"|"listen"|"speak"|"journal"|null
  // dérive le pilier depuis step.pillar (prioritaire) ; sinon heuristique sur target.tab/anchor
  //   grammaire -> study ; vocab/phrases -> read ; training+anchor "quiz-listen" -> listen ;
  //   prononciation (+ anchor "shadowing") -> speak ; carnet -> journal
  // (avec le champ pillar explicite ajouté en data.js, l'heuristique n'est qu'un filet)

defaultTaskFor(pillar, ctx) -> { pillar, label, target, auto }
  // ctx = { srsDue:Number, prompt:String }
  // renvoie la tâche de consolidation décrite en §1

buildDayPlan(lesson, ctx) -> [ {pillar, label, target, auto} x5 ]
  // ctx = { srsDue:Number, prompt:String }
  // pour chaque pilier de l'ordre figé : 1ère étape de lesson.steps dont pillarForStep == pilier,
  //   sinon defaultTaskFor(pilier, ctx). lesson peut être null (=> 5 tâches par défaut).
  // `auto` = true pour read (SRS) et listen (quiz) — les piliers détectables par les hooks existants.

isPlanComplete(dayPillars) -> bool   // ré-exporte l'idée de "5/5" (ou on réutilise CH.dayComplete)
```
- `auto:true` marque les tâches que les hooks existants cochent tout seuls (Lire via `srsUpdate`, Écouter via quiz écoute). Les autres portent une action manuelle `✓ Fait`.
- Le module ne connaît pas l'état du jour ; il décrit **quoi faire**. L'état coché/pas coché vient de `challenge-core` (`dayPillars`).

### 3. data.js — tags de piliers + prompts
- Ajouter un champ **`pillar`** à **chaque étape** des 7 leçons (valeurs de l'ordre figé). Exemple :
  ```
  { text: "Apprends le thème « Personnes & famille ».", target: {tab:"vocab", theme:"Personnes & famille"}, pillar: "read" }
  { text: "Lis « L'ossature de la phrase »…", target:{tab:"grammaire"}, pillar: "study" }
  { text: "Tire le sujet « Présente-toi » et dis-le à voix haute.", target:{tab:"carnet"}, pillar: "speak" }
  ```
- Là où une leçon n'a pas d'étape Parler et/ou Journal, la tâche par défaut prend le relais (prompt tiré du pool `PROMPTS D'EXPRESSION` déjà présent dans `index.html`). Pas besoin d'inventer du contenu par leçon si le pool suffit ; on peut néanmoins tagger un prompt « journal » vs « parler » si utile (optionnel, à trancher au plan).

### 4. UI — onglet Challenge (`#tab-challenge`)
Refonte du rendu (le panneau et le bloc JS existent déjà) :
- **Barre haute** : `🔥 <streak> · <xpJour>/70 XP` + total XP discret + `<n>/5` du jour.
- **Héros = checklist** : titre (« Leçon 3 — Te présenter » ou « Consolidation ») puis 5 lignes, une par pilier, via `buildDayPlan(...)` :
  - état `✓` (pilier coché dans `challenge`) / `○` sinon ;
  - libellé concret ;
  - action : `→ Aller` (lien profond `goTo(target)`) et, pour les non-auto, `✓ Fait` (→ `markPillar(pillar, true)`) ; les tâches `auto` affichent `⚡`.
- **Célébration 5/5** : quand les 5 piliers passent cochés, toast/effet « 🎉 Journée pleine · +70 XP » (réutilise le mécanisme de toast des badges).
- **`▸ Voir ma progression`** (`<details>`, replié) : la grille 75, les badges, le XP total, (option : les anneaux détaillés). C'est l'actuel contenu, déplacé sous le pli.
- Les **anneaux** actuels comme héros sont **retirés** (remplacés par la checklist) ; ils peuvent survivre en mini-indicateur dans le `<details>` ou être supprimés (à trancher au plan — préférence : supprimer, la checklist les remplace).

### 5. UI — accueil (`#tab-home`)
- **Nouvelle carte « Ta journée »** en haut : titre leçon du jour + `🔥 <streak>` + `<n>/5 fait` + bouton **`Continuer →`** (→ `activateTab("challenge")`).
  - Journée pleine → « ✅ Journée faite — à demain ! » ; fil épuisé → « Consolidation ».
- **Retrait** de l'ancien `#ch-mini` (ronds cryptiques) **et** de l'ancien encart « prochaine leçon » — remplacés par cette carte unique.
- Le hero « 9 mois » et les tuiles (J-, révisions, %) restent en dessous, inchangés.

### 6. Style
Réutilise les variables CSS existantes. Checklist : lignes avec puce d'état, libellé, actions à droite ; responsive (les actions passent sous le libellé en mobile). Pas de dépendance externe.

### 7. Service worker
- `sw.js` : bump `CACHE` → `bahasa-v6` ; ajouter `"./journee-core.js"` au précache `SHELL`.

## Vérification
- **Tests unitaires** (`node:test`) sur `journee-core.js` :
  - `pillarForStep` : champ `pillar` explicite prioritaire ; heuristique de secours (grammaire→study, vocab/phrases→read, quiz-listen→listen, prononciation/shadowing→speak, carnet→journal) ; `null` si rien.
  - `defaultTaskFor` : renvoie label/target/auto attendus par pilier ; injecte `srsDue` (Lire) et `prompt` (Parler).
  - `buildDayPlan` : renvoie 5 tâches dans l'ordre figé ; utilise l'étape de leçon quand elle existe pour ce pilier, sinon la tâche par défaut ; `lesson=null` → 5 tâches par défaut ; `auto` correct (read/listen = true).
- **Navigateur (manuel)** : onglet Challenge affiche la leçon du jour + 5 tâches ; `→ Aller` ouvre le bon endroit ; faire une révision SRS coche Lire, un quiz écoute coche Écouter ; `✓ Fait` coche Étudier/Parler/Journal ; 5/5 → célébration + case grille pleine + streak +1 ; `▸ Voir ma progression` déplie grille/badges ; l'accueil montre la carte « Ta journée » et `Continuer →` ouvre l'onglet ; l'ancien encart à ronds et « prochaine leçon » ont disparu ; SW en `bahasa-v6`.

## Risques & parades
| Risque | Parade |
|---|---|
| Étape de leçon sans pilier clair | champ `pillar` explicite en data.js (prioritaire) ; heuristique en secours ; défaut si toujours rien |
| Pilier non couvert par la leçon | `defaultTaskFor` garantit toujours 5 tâches |
| Pilier « Étudier » non détectable automatiquement | action manuelle `✓ Fait` sur la ligne (pas de dépendance à un event) |
| Lien profond cassé (thème/ancre absents) | `goTo` existant ignore déjà thème/ancre introuvables sans planter |
| Régression : retrait des anciens encarts | vérifier qu'aucun autre code ne cible `#ch-mini` / l'ancien encart avant suppression |
| Cache PWA périmé | bump `bahasa-v6` |

## Hors périmètre / plus tard
- Leçons Phases 2 & 3, réécriture de contenu.
- Notifications, personnalisation du plan.
- Historique détaillé par jour au-delà de la grille.
