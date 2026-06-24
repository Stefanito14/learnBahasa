# Spec — Chantier n°2 : Mémorisation (répétition espacée + cahier d'erreurs)

**Date :** 2026-06-24
**Projet :** Bahasa Indonesia — `plan-indonesien.html`
**Pré-requis :** Chantier n°1 (Audio + Écoute) terminé et mergé.

---

## 1. Contexte

Les flashcards (onglet Vocabulaire) marquent aujourd'hui un mot « connu » **définitivement** (`known` map dans `Store`) et retirent la carte du paquet. Aucune notion de ré-exposition dans le temps : un mot « connu » une fois ne revient jamais, donc on l'oublie. Les quiz (vocabulaire, écoute, nombres) ne gardent **aucune** trace de ce qui est su ou raté.

## 2. Objectif

Mettre en place une **répétition espacée (SRS)** par paliers (Leitner) sur le vocabulaire, **alimentée par les flashcards ET les quiz** (cahier d'erreurs automatique), pour que le vocabulaire entre et **reste**.

## 3. Décisions verrouillées (brainstorming)

| Sujet | Décision |
|---|---|
| Moteur | **Leitner** (paliers), pas SM-2 |
| Paliers → délai avant retour | 1 → **1 j**, 2 → **3 j**, 3 → **7 j**, 4 → **16 j**, 5 → **35 j**, 6 (maîtrisé) → **120 j** |
| Alimentation | **Unifiée** : flashcards + quiz (vocab & écoute) mettent à jour le même état |
| Quiz nombres | **Exclu** du SRS (nombres tirés au hasard, pas de mot stable) |
| Périmètre | **Vocabulaire seulement** (~277 mots / `FLAT`). Phrases & dialogues = exposition, hors SRS |
| Migration | Les `known` existants → palier **6 (maîtrisé)** ; rien de perdu |
| UI | Flashcards = « révision du jour » (cartes dues d'abord) ; tuile « à réviser » sur l'accueil ; compteur « maîtrisés » dans le Carnet |

## 4. Non-objectifs

- SM-2 / facteur de facilité ; re-drill intra-session des cartes ratées → hors périmètre (v2 éventuelle).
- SRS sur les phrases/dialogues.
- Multi-appareils / synchro de l'état SRS → **chantier n°3**.

---

## 5. Design

### 5.1 Modèle de données & stockage

- Clé `Store` : **`srs`** → objet JSON `{ "<id>": { box: 1..6, due: "YYYY-MM-DD" }, ... }`, indexé par l'`id` indonésien du mot (même clé que l'ancien `known`).
- **Carte jamais vue** = absente de la map → considérée **due aujourd'hui**.
- **Migration unique au chargement** : si `srs` n'existe pas encore mais `known` oui, pour chaque id de `known` → `srs[id] = { box: 6, due: today + 120 j }`. Puis on persiste `srs`. (`known` n'est plus utilisé ensuite.)
- Le bouton « Réinitialiser » global efface aussi `srs`.

### 5.2 Logique pure — `srs-core.js` (module UMD testable)

Comme `audio-core.js` : `window.SrsCore` (navigateur) + `module.exports` (Node). Aucune dépendance, ES5.

- `BOX_DAYS = [0, 1, 3, 7, 16, 35, 120]` — indexé par palier (1..6 ; index 0 inutilisé).
- `intervalForBox(box) -> number` : `BOX_DAYS[clamp(box,1,6)]`.
- `addDays(iso, n) -> iso` : arithmétique de dates pure sur `"YYYY-MM-DD"` (UTC, pour rester déterministe).
- `nextState(prev, knewIt, todayISO) -> { box, due }` :
  - `base = prev ? prev.box : 1`
  - `box = knewIt ? min(base + 1, 6) : 1`
  - `due = addDays(todayISO, intervalForBox(box))`
- `isDue(state, todayISO) -> boolean` : `!state` → `true` ; sinon `state.due <= todayISO` (comparaison de chaînes ISO valide).
- `dueIds(srsMap, allIds, todayISO) -> string[]` : les `allIds` dont `isDue(srsMap[id], today)` est vrai (jamais-vus inclus). Ordre : déjà-vus en retard d'abord (par `due` croissant), puis jamais-vus.
- `masteredCount(srsMap) -> number` : nombre d'états avec `box === 6`.

### 5.3 Mise à jour unifiée (dans le grand IIFE de la page)

- État chargé au démarrage : `srs` (depuis `Store`, JSON), + migration §5.1.
- `todayISO()` : `new Date().toISOString().slice(0,10)` (cohérent avec le Carnet existant).
- `srsUpdate(id, knewIt)` :
  - `srs[id] = SrsCore.nextState(srs[id], knewIt, todayISO())`
  - `Store.set("srs", JSON.stringify(srs))`
  - rafraîchit la tuile « à réviser » et le compteur « maîtrisés ».
- **Flashcards** : `✓ Je savais` → `srsUpdate(id, true)` ; `↻ Pas encore` → `srsUpdate(id, false)`. `Passer` (ex-« Suivante ») = carte suivante sans rien changer.
- **Quiz vocabulaire** & **Quiz d'écoute** : dans le handler de réponse, après avoir déterminé correct/incorrect, appeler `srsUpdate(current.id, estCorrect)`. (Le quiz nombres n'appelle pas `srsUpdate`.)

### 5.4 Expérience (UI)

- **Flashcards → « révision du jour »** : le paquet par défaut = `dueIds(srs, FLAT_ids, today)` (les cartes dues, retards d'abord). Le filtre par thème restreint aux cartes dues de ce thème. Méta affichée : « À réviser aujourd'hui : N ».
  - Quand le paquet dû est **vide** : message « 🎉 À jour ! Rien à réviser aujourd'hui. » + bouton **« Réviser en avance »** qui propose les cartes non encore maîtrisées (palier < 6, par `due` croissant) ; les noter met quand même à jour le SRS.
- **Accueil** : nouvelle tuile dans `.hero-meta` — « 📚 À réviser aujourd'hui : N » (N = `dueIds(...).length`). Clic → onglet Vocabulaire.
- **Carnet** : nouvelle stat « Mots maîtrisés : X / `FLAT.length` » (X = `masteredCount(srs)`).

### 5.5 Structure de fichiers

```
learnBahasa/
  plan-indonesien.html   # modifié : charge srs-core.js ; flashcards SRS ; hooks quiz ; tuile accueil ; stat carnet ; reset
  srs-core.js            # NEW — logique paliers (UMD : window.SrsCore / module.exports)
  tests/
    srs-core.test.js     # NEW
```

## 6. Vérification

- **Tests unitaires** (`node:test`) sur `srs-core.js` : `intervalForBox` (clamp), `addDays` (passage de mois/an), `nextState` (su monte+plafonne à 6 ; pas-su retombe à 1 ; carte neuve), `isDue` (neuf=dû, échéance passée/future), `dueIds` (inclut les neufs, ordre retards d'abord), `masteredCount`.
- **Vérification navigateur** (manuelle) : une bonne réponse en quiz fait monter le mot / une mauvaise le ramène en révision ; la tuile accueil affiche le bon compte ; « Je savais / Pas encore » reprogramment la carte ; migration des `known` en maîtrisés ; rien à réviser → message + « réviser en avance » ; reset efface le SRS.

## 7. Risques & parades

| Risque | Parade |
|---|---|
| Décalage de date/fuseau | `addDays` en UTC déterministe ; `todayISO()` aligné sur le Carnet existant |
| Migration qui s'exécute deux fois | Migration seulement si `srs` absent ; une fois `srs` écrit, plus de migration |
| `srs` corrompu dans le stockage | `JSON.parse` sous `try/catch` → `srs = {}` (cartes redeviennent dues, sans crash) |
| Mots du quiz hors vocab | Seuls les items avec `.id` de `FLAT` appellent `srsUpdate` ; nombres exclus |

## 8. Questions ouvertes

Aucune bloquante. La synchro multi-appareils de l'état `srs` est explicitement repoussée au chantier n°3.
