# Spec — Mode « Challenge 75 » (75 Fluent gamifié)

**Date :** 2026-07-21
**Projet :** Bahasa Indonesia — `index.html`
**Problème :** l'app a le contenu et le SRS, mais rien qui pousse à revenir *tous les jours*. On veut une boucle d'habitude quotidienne motivante, inspirée du **75 Fluent Challenge** (déclinaison langues du 75 Hard : 75 jours, 5 piliers quotidiens — Study / Read / Speak / Listen / Journal).

## Objectif
Ajouter un **mode Challenge 75** gamifié : chaque jour, valider 5 piliers (dont 3 se cochent automatiquement quand on utilise l'app), avec streak 🔥, XP, anneaux du jour, grille de progression sur 75 journées et badges à paliers. But : rendre la pratique quotidienne satisfaisante et donner envie d'y revenir.

## Décisions verrouillées (brainstorming)
- **Validation d'une journée = hybride.** 3 piliers **auto-détectés** via l'usage de l'app + 2 piliers **manuels** (toggle).
  - **Study** → auto, via `lessonDone()` (une leçon du Parcours avancée).
  - **Read** → auto, via `srsUpdate()` (au moins une carte SRS révisée).
  - **Listen** → auto, via la fin d'un quiz écoute (hook dédié à isoler).
  - **Speak** → manuel (toggle « j'ai parlé à voix haute »).
  - **Journal** → manuel (toggle « journal écrit »), avec raccourci vers le Carnet.
- **Règle de ratage = souple.** Rater un jour **casse la streak** (retombe à 0) mais **ne remet pas** la progression /75 à zéro ; il reste juste ce jour à valider. Pas de reset total type 75 Hard.
- **Ce que compte « /75 » = journées pleines** (les 5 piliers validés le même jour), **pas** les jours calendaires écoulés. Usage solo long terme, pas une course contre la montre.
- **XP** : **+10 XP par pilier validé**, **+20 XP bonus** si les 5 piliers d'un jour sont faits (journée pleine = 70 XP).
- **Gamification retenue (les 4) :** streak 🔥 + grille 75 jours ; XP/points ; badges/paliers ; anneaux du jour (façon Apple Watch).
- **Emplacement :** **nouvel onglet « Challenge »** dans la nav (à côté de Parcours) avec le cockpit complet ; **+ mini-encart** (anneaux + streak) sur l'Accueil qui renvoie vers l'onglet.

## Non-objectifs
- Notifications push / rappels quotidiens (plus tard).
- Jokers/freezes de streak (envisagé, non retenu pour cette passe).
- Sync multi-appareils / communauté / classement (l'app est solo, local-first).
- Re-détection rétroactive d'activité passée : le challenge ne compte qu'à partir de `startDate`.

---

## Design

### 1. Modèle de données (clé Store `challenge`)
État sérialisé minimal, tout le reste étant **dérivé par calcul** (pas de compteurs dupliqués → pas de désync) :
```
{
  startDate: "2026-07-21",           // jour 1 (todayISO au premier lancement du challenge)
  days: {                            // une entrée par jour touché uniquement
    "2026-07-21": { study:true, read:true, listen:false, speak:true, journal:false }
  }
}
```
- Ordre des piliers figé : `["study","read","listen","speak","journal"]`.
- Parse `try/catch` → état vide ; `startDate` posé à `todayISO()` au premier marquage si absent.

### 2. Logique pure — `challenge-core.js` (UMD, testé)
Même patron que `srs-core.js` / `parcours-core.js`. Aucune dépendance DOM ; reçoit l'état + `todayISO`.

```
PILLARS = ["study","read","listen","speak","journal"]
XP_PER_PILLAR = 10
FULL_DAY_BONUS = 20
MILESTONES = [7, 21, 50, 75]

setPillar(state, dayISO, pillar, value=true) -> newState   // pur, renvoie un nouvel état
dayPillars(state, dayISO) -> {study,read,listen,speak,journal}  // défaut tout false
dayCount(day) -> nombre de piliers vrais (0..5)
dayComplete(day) -> bool                                    // 5/5
xpForDay(day) -> count*10 (+20 si complet)
totalXp(state) -> somme sur tous les jours
daysCompleted(state) -> nb de journées pleines (progression /75)
streak(state, todayISO) -> nb de journées PLEINES consécutives finissant à aujourd'hui
                           (ou hier si rien encore aujourd'hui — même tolérance que le Carnet)
ringsForToday(state, todayISO) -> {study,read,listen,speak,journal} (état des 5 anneaux)
badgesUnlocked(state) -> [7,21,...] paliers de journées atteints
progress(state) -> { done: daysCompleted, total: 75, pct }
```
- **Streak souple** : on marche à rebours depuis aujourd'hui (tolérance : si aujourd'hui vide mais hier plein, on part d'hier — cf. `streak()` existant du Carnet [index.html:1489]) et on compte les journées **pleines** consécutives ; premier trou → stop.
- **`daysCompleted` plafonné à 75** pour l'affichage `/75` ; XP et badges continuent au-delà.

### 3. Hooks d'intégration (dans `index.html`)
Un seul point d'entrée UI : `markPillar(pillar)` → appelle `ChallengeCore.setPillar`, persiste (`Store.set("challenge", …)`), puis `renderChallenge()` + `refreshChallengeMini()` (encart accueil) + éventuel toast badge.

- **Study** : dans `lessonDone(id, done)` [index.html:1024] — si `done`, `markPillar("study")`.
- **Read** : dans `srsUpdate(id, knewIt)` [index.html:993] — à chaque révision, `markPillar("read")`.
- **Listen** : au callback de fin de quiz écoute (**hook à localiser précisément au moment du plan** — le quiz écoute alimente déjà `srsUpdate`, donc distinguer « quiz écoute terminé » de « carte révisée »). `markPillar("listen")`.
- **Speak / Journal** : boutons toggle dans l'onglet Challenge → `markPillar("speak")` / `markPillar("journal")`. Journal propose aussi un lien « → Écrire dans le Carnet » (`activateTab("carnet")`).
- Les piliers auto peuvent être **dé-cochés manuellement** si besoin (toggle), mais se re-cochent au prochain déclenchement — comportement acceptable.

### 4. UI — onglet « Challenge »
Nouveau `<button data-tab="challenge">Challenge</button>` dans la nav (près de Parcours) + `<section class="panel" id="tab-challenge">`.

**A. Cockpit du jour** (en haut) :
- **5 anneaux/pastilles** (un par pilier, ordre figé), remplis quand validés ; les 3 auto portent un ⚡ « fait dans l'app », les 2 manuels sont des toggles cliquables.
- **Streak 🔥** (gros chiffre) + **XP du jour** (`x/70`).
- Libellés FR : Étudier / Lire / Écouter / Parler / Journal.

**B. Grille 75** :
- 75 cases (grille responsive ~15×5). État par case : **pleine** (journée complète), **partielle** (jour entamé, <5), **vide** (à faire).
- Les cases des paliers **7 / 21 / 50 / 75** portent un liseré (badge associé).
- Compteur « **N / 75 journées pleines** » + barre de progression.

**C. Badges / paliers** (thème indonésien léger) :
- 🏝️ *Bali* (J7) · 🌋 *Krakatau* (J21) · 🐉 *Komodo* (J50) · 🏆 *Merdeka* (J75) · ⭐ badge XP (ex: 1000 XP).
- Débloqué = coloré + date ; verrouillé = grisé. Petit **toast** à l'instant du déblocage.
- **XP total** affiché + progression vers le prochain badge.

### 5. Accueil — mini-encart
Encart compact en haut de `#tab-home` : les **5 anneaux miniature** + **streak 🔥** + « XP du jour », cliquable → `activateTab("challenge")`. Alimenté par `refreshChallengeMini()` (mêmes calculs core). N'alourdit pas l'accueil (une ligne).

### 6. Style
Réutilise les variables CSS existantes (`--ocean`, `--turmeric`, `--ink`, `--muted`, `--line`). Anneaux : soit SVG `stroke-dasharray`, soit pastilles rondes CSS (choix tranché au plan — pastilles si plus simple/robuste). Pas de dépendance externe (cohérent PWA offline).

## Vérification
- **Tests unitaires** (`node:test`) sur `challenge-core.js` :
  - `setPillar` renvoie un nouvel état sans muter l'entrée ; crée `days[dayISO]` au besoin.
  - `dayCount` / `dayComplete` (0→5, complet à 5).
  - `xpForDay` (count*10 ; +20 si 5/5 → 70), `totalXp` (somme multi-jours).
  - `daysCompleted` (compte les journées pleines ; ignore les partielles).
  - `streak` : jours pleins consécutifs ; tolérance aujourd'hui-vide/hier-plein ; trou → coupe ; partielle ≠ plein.
  - `badgesUnlocked` (paliers franchis / non franchis), `progress` (done/total/pct, plafond 75).
- **Navigateur (manuel)** : avancer une leçon coche Étudier ; réviser une carte coche Lire ; finir un quiz écoute coche Écouter ; toggles Parler/Journal marchent ; une journée 5/5 ajoute une case pleine à la grille + 70 XP + streak +1 ; rater un jour casse la streak sans vider la grille ; franchir J7 affiche le toast badge ; l'encart accueil reflète le jour et renvoie à l'onglet.

## Risques & parades
| Risque | Parade |
|---|---|
| `challenge` corrompu dans Store | parse `try/catch` → état vide ; `dayPillars` défaut tout-false |
| Hook Listen confondu avec Read (quiz écoute → `srsUpdate`) | localiser le callback propre de fin de quiz écoute au plan ; ne pas cocher Listen depuis `srsUpdate` |
| Fuseau/`toisoString` UTC vs local | réutiliser `todayISO()` existant [index.html:986] partout (cohérence avec SRS & Carnet) |
| Piliers auto re-cochés après décochage manuel | comportement accepté et documenté (le déclencheur re-coche) |
| Accueil surchargé | encart mini sur **une ligne**, cockpit complet réservé à l'onglet |

## Hors périmètre / plus tard
- Jokers/freezes de streak.
- Notifications/rappels quotidiens.
- Personnalisation du mapping des piliers par l'utilisateur.
- Historique détaillé par jour (au-delà de la grille) / export.
