# Parcours guidé (fil de mini-leçons) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la checklist de jalons du Parcours par un fil de mini-leçons guidées (Phase 1) : chaque leçon a un objectif + des étapes qui pointent (lien profond) vers le bon endroit du site, avec suivi de progression et mise en avant de la prochaine leçon.

**Architecture:** Logique pure de progression dans `parcours-core.js` (testée). Les leçons sont des données dans `data.js`. La page tient un état `lessons` (Store), une fonction `goTo(target)` qui ouvre le bon onglet + section + thème de flashcards, et rend le fil dans l'onglet Parcours. Les phases 2 & 3 viendront plus tard (le moteur les accueille sans changement).

**Tech Stack:** HTML/CSS/JS vanilla ES5 (aucune dépendance runtime) ; Node.js + `node:test` pour la logique pure.

## Global Constraints

- **Aucune dépendance runtime** ; ES5 (`var`, fonctions classiques, IIFE) ; helpers `$`/`$$` ; persistance via `Store`.
- **`parcours-core.js`** : UMD → `window.ParcoursCore` (navigateur) ET `module.exports` (Node).
- **Stockage** : clé `Store` **`lessons`** = JSON `{ "<id>": "done" }` ; parse sous `try/catch` → `{}`.
- **Leçons** : données dans `window.BAHASA_DATA.lessons` (tableau ordonné). Forme d'une leçon : `{ id, phase, title, goal, steps:[{ text, target:{ tab, theme?, anchor? } }] }`.
- **Prochaine leçon** = première leçon (dans l'ordre) non « done ».
- **`goTo(target)`** : `activateTab(target.tab)` ; si `theme` → clic du chip `#flash-filter .chip[data-th=theme]` ; si `anchor` → `scrollIntoView` (après petit `setTimeout`).
- **Validation manuelle** ; **parcours souple** (toutes leçons cliquables, pas de verrouillage).
- **Retrait** des blocs jalons `.checks[data-phase="p1|p2|p3"]` ; **conservation** des `.checks.cando[data-phase="c1|c2|c3"]` et du calendrier (replié sous `<details>`).
- Réutiliser `activateTab`, `closeMenu`, `Store`, `$`, `$$` (déjà présents). Ne pas les redéclarer.

## Stratégie de test
- **Logique pure → tests auto** (`node:test`) : `parcours-core.js`, structure des `lessons`.
- **DOM → vérification navigateur manuelle** (faite par le contrôleur/l'utilisateur).
- `npm test` = `node --test`. Lancer la page : `npx serve .`.

## Structure de fichiers (cible)
```
learnBahasa/
  parcours-core.js          # NEW — logique progression (UMD)
  tests/parcours-core.test.js  # NEW
  data.js                   # MODIF — ajout du tableau `lessons`
  tests/data.test.js        # MODIF — test structure lessons
  index.html                # MODIF — <script>, runtime parcours, goTo, rendu du fil, restructure onglet Parcours, ancre shadowing, banner accueil, reset
```

---

### Task 1: `parcours-core.js` (logique pure) + tests

**Files:**
- Create: `parcours-core.js`
- Test: `tests/parcours-core.test.js`

**Interfaces (produites, `window.ParcoursCore` / `require`) :**
- `isLessonDone(doneMap, id) -> boolean`
- `nextLessonId(orderedIds, doneMap) -> string|null`
- `lessonsProgress(orderedIds, doneMap) -> {done, total, pct}`

- [ ] **Step 1: Écrire le test (qui échoue)**

Create `tests/parcours-core.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const P = require("../parcours-core.js");

test("isLessonDone", () => {
  assert.strictEqual(P.isLessonDone({ a: "done" }, "a"), true);
  assert.strictEqual(P.isLessonDone({ a: "done" }, "b"), false);
  assert.strictEqual(P.isLessonDone(null, "a"), false);
  assert.strictEqual(P.isLessonDone({ a: "x" }, "a"), false);
});

test("nextLessonId: première non faite ; null si toutes faites", () => {
  assert.strictEqual(P.nextLessonId(["a", "b", "c"], {}), "a");
  assert.strictEqual(P.nextLessonId(["a", "b", "c"], { a: "done" }), "b");
  assert.strictEqual(P.nextLessonId(["a", "b", "c"], { a: "done", c: "done" }), "b");
  assert.strictEqual(P.nextLessonId(["a", "b"], { a: "done", b: "done" }), null);
  assert.strictEqual(P.nextLessonId([], {}), null);
});

test("lessonsProgress: done/total/pct arrondi", () => {
  assert.deepStrictEqual(P.lessonsProgress(["a", "b", "c", "d"], { a: "done", b: "done" }), { done: 2, total: 4, pct: 50 });
  assert.deepStrictEqual(P.lessonsProgress([], {}), { done: 0, total: 0, pct: 0 });
  assert.deepStrictEqual(P.lessonsProgress(["a", "b", "c"], { a: "done" }), { done: 1, total: 3, pct: 33 });
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npm test`
Expected: FAIL — `Cannot find module '../parcours-core.js'`.

- [ ] **Step 3: Implémenter `parcours-core.js`**

```js
(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.ParcoursCore = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isLessonDone(doneMap, id) {
    return !!doneMap && doneMap[id] === "done";
  }

  function nextLessonId(orderedIds, doneMap) {
    for (var i = 0; i < orderedIds.length; i++) {
      if (!isLessonDone(doneMap, orderedIds[i])) return orderedIds[i];
    }
    return null;
  }

  function lessonsProgress(orderedIds, doneMap) {
    var total = orderedIds.length, done = 0;
    for (var i = 0; i < orderedIds.length; i++) {
      if (isLessonDone(doneMap, orderedIds[i])) done++;
    }
    return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
  }

  return { isLessonDone: isLessonDone, nextLessonId: nextLessonId, lessonsProgress: lessonsProgress };
});
```

- [ ] **Step 4: Lancer le test pour le voir passer**

Run: `npm test`
Expected: PASS (3 nouveaux tests + tous les existants).

- [ ] **Step 5: Commit**

```bash
git add parcours-core.js tests/parcours-core.test.js
git commit -m "feat: parcours-core (progression du fil guide) + tests"
```

NOTE : dépôt `c:/Users/stefan.godin_selectr/Herd/learnBahasa`, branche `feat/parcours-guide` (active). ⚠️ commit uniquement les 2 fichiers nommés (jamais `git add -A`/`.` — centaines de mp3).

---

### Task 2: Données des leçons dans `data.js`

**Files:**
- Modify: `data.js` (ajout du tableau `lessons` + export)
- Modify: `tests/data.test.js` (test de structure)

**Interfaces:** Produces `window.BAHASA_DATA.lessons` (tableau ordonné de leçons).

- [ ] **Step 1: Ajouter le test (qui échoue)**

Dans `tests/data.test.js`, ajouter un nouveau bloc `test(...)` (sans toucher aux existants) :

```js
test("lessons: structure du fil guidé", () => {
  assert.ok(Array.isArray(DATA.lessons) && DATA.lessons.length >= 7, "au moins 7 leçons");
  assert.ok(DATA.lessons.every((l) => l.id && l.phase && l.title && l.goal && Array.isArray(l.steps) && l.steps.length > 0));
  assert.ok(DATA.lessons.every((l) => l.steps.every((s) => s.text && s.target && s.target.tab)));
  const ids = DATA.lessons.map((l) => l.id);
  assert.strictEqual(new Set(ids).size, ids.length, "ids uniques");
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npm test`
Expected: FAIL (DATA.lessons indéfini).

- [ ] **Step 3: Ajouter le tableau `lessons` dans `data.js`**

Dans `data.js`, à l'intérieur de la `factory`, juste avant la ligne `return { vocab: vocab, ... };`, ajouter :

```js
  var lessons = [
    { id: "p1-l1", phase: 1, title: "Les sons de la langue",
      goal: "Lire l'indonésien à voix haute sans bloquer.",
      steps: [
        { text: "Lis les voyelles et consonnes, et clique 🔊 pour écouter chaque exemple.", target: { tab: "prononciation" } },
        { text: "Répète 4 phrases en imitant le rythme (shadowing).", target: { tab: "prononciation", anchor: "shadowing" } }
      ] },
    { id: "p1-l2", phase: 1, title: "Bonjour & merci",
      goal: "Saluer poliment et remercier dans toutes les situations.",
      steps: [
        { text: "Apprends les cartes du thème « Salutations & politesse ».", target: { tab: "vocab", theme: "Salutations & politesse" } },
        { text: "Lis les phrases de « L'essentiel » à voix haute.", target: { tab: "phrases" } },
        { text: "Teste-toi : 5 questions du quiz de vocabulaire.", target: { tab: "training", anchor: "quiz-voc" } }
      ] },
    { id: "p1-l3", phase: 1, title: "Te présenter",
      goal: "Dire ton nom, d'où tu viens et ce que tu fais.",
      steps: [
        { text: "Apprends le thème « Personnes & famille ».", target: { tab: "vocab", theme: "Personnes & famille" } },
        { text: "Lis « L'ossature de la phrase » (ordre des mots, pas de verbe être).", target: { tab: "grammaire" } },
        { text: "Repère les phrases « Sympathiser » (Je m'appelle…, D'où venez-vous ?).", target: { tab: "phrases" } },
        { text: "Tire le sujet « Présente-toi » et dis-le à voix haute.", target: { tab: "carnet" } }
      ] },
    { id: "p1-l4", phase: 1, title: "Compter & les prix",
      goal: "Dire et comprendre les nombres et un prix.",
      steps: [
        { text: "Apprends le thème « Nombres ».", target: { tab: "vocab", theme: "Nombres" } },
        { text: "Entraîne-toi avec le quiz des nombres.", target: { tab: "training", anchor: "quiz-num" } },
        { text: "Apprends le thème « Argent & marché ».", target: { tab: "vocab", theme: "Argent & marché" } },
        { text: "Repère les phrases « Se débrouiller » (Berapa harganya ?).", target: { tab: "phrases" } }
      ] },
    { id: "p1-l5", phase: 1, title: "Commander à manger",
      goal: "Commander simplement, sans piment.",
      steps: [
        { text: "Apprends le thème « Nourriture & boisson ».", target: { tab: "vocab", theme: "Nourriture & boisson" } },
        { text: "Fais le drill « Saya mau ___ ».", target: { tab: "training", anchor: "drill-mount" } },
        { text: "Joue le dialogue « Commander au warung » à voix haute.", target: { tab: "phrases", anchor: "dialogues-mount" } }
      ] },
    { id: "p1-l6", phase: 1, title: "Dire non & poser des questions",
      goal: "Nier correctement et poser 5 questions de base.",
      steps: [
        { text: "Lis « Dire non » (tidak vs bukan).", target: { tab: "grammaire" } },
        { text: "Lis « Poser des questions » (apa, siapa, di mana…).", target: { tab: "grammaire" } },
        { text: "Fais le drill « Di mana ___ ? ».", target: { tab: "training", anchor: "drill-mount" } }
      ] },
    { id: "p1-l7", phase: 1, title: "Présent, passé, futur",
      goal: "Situer une action dans le temps avec sudah / sedang / akan.",
      steps: [
        { text: "Lis « Le temps sans conjugaison ».", target: { tab: "grammaire" } },
        { text: "Apprends le thème « Temps ».", target: { tab: "vocab", theme: "Temps" } },
        { text: "Fais le drill « Saya sudah ___ ».", target: { tab: "training", anchor: "drill-mount" } },
        { text: "Tire le sujet « Raconte ta journée d'hier » et raconte-la.", target: { tab: "carnet" } }
      ] }
  ];
```

Puis ajouter `lessons: lessons` à l'objet retourné :
`return { vocab: vocab, phrases: phrases, dialogues: dialogues, drills: drills, food: food, lessons: lessons };`

- [ ] **Step 4: Lancer les tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add data.js tests/data.test.js
git commit -m "feat: donnees des lecons (fil guide Phase 1) dans data.js"
```

NOTE : ⚠️ commit uniquement `data.js` et `tests/data.test.js`. Les thèmes cités (« Salutations & politesse », etc.) doivent correspondre **exactement** aux `theme` de `VOCAB` (chips de flashcards).

---

### Task 3: Runtime du parcours (état, `goTo`, prochaine leçon) + ancre + reset

**Files:**
- Modify: `index.html` (balise `<script>` ; bloc runtime dans le grand IIFE ; ancre `shadowing` ; reset)

**Interfaces:**
- Consumes: `window.ParcoursCore`, `window.BAHASA_DATA.lessons`, `Store`, `activateTab`, `closeMenu`, `$`/`$$`.
- Produces (portée du grand IIFE) : `LESSONS`, `LESSON_IDS`, `lessonsState`, `lessonsReady` (Promise), `goTo(target)`, `lessonDone(id, done)`, `refreshNextLesson()`.

- [ ] **Step 1: Charger `parcours-core.js`**

Repère la balise `<script src="srs-core.js"></script>`. Ajouter juste **après** :
```html
<script src="parcours-core.js"></script>
```

- [ ] **Step 2: Ajouter l'ancre `shadowing`**

Dans l'onglet Prononciation, repère le `<div class="gcard">` qui contient `<h3>Écoute &amp; répète (shadowing)</h3>`. Ajouter l'attribut `id="shadowing"` à ce `<div class="gcard">` → `<div class="gcard" id="shadowing">`.

- [ ] **Step 3: Ajouter le bloc runtime PARCOURS**

Repère la fin du bloc `/* ---------- SRS (répétition espacée) ---------- */` (la déclaration `var srsReady = Store.get("srs").then(...)` se termine par `});`). Juste **après**, insérer :

```js
/* ---------- PARCOURS (fil guidé) ---------- */
var LESSONS = (window.BAHASA_DATA && window.BAHASA_DATA.lessons) || [];
var LESSON_IDS = LESSONS.map(function(l){ return l.id; });
var lessonsState = {};
function refreshNextLesson(){
  var id = window.ParcoursCore.nextLessonId(LESSON_IDS, lessonsState);
  var title = "Phase 1 terminée 🎉 — la suite arrive";
  for(var i=0;i<LESSONS.length;i++){ if(LESSONS[i].id===id){ title = LESSONS[i].title; break; } }
  $$(".next-lesson-title").forEach(function(el){ el.textContent = title; });
}
function lessonDone(id, done){
  if(done) lessonsState[id] = "done"; else delete lessonsState[id];
  Store.set("lessons", JSON.stringify(lessonsState));
  if(typeof renderLessons === "function") renderLessons();
  refreshNextLesson();
}
function goTo(target){
  if(!target || !target.tab) return;
  activateTab(target.tab);
  if(typeof closeMenu === "function") closeMenu();
  if(target.theme){
    $$('#flash-filter .chip').forEach(function(c){ if(c.getAttribute("data-th")===target.theme) c.click(); });
  }
  if(target.anchor){
    setTimeout(function(){ var el=document.getElementById(target.anchor); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); }, 70);
  }
}
var lessonsReady = Store.get("lessons").then(function(v){
  if(v){ try{ lessonsState = JSON.parse(v) || {}; }catch(e){ lessonsState = {}; } }
  if(typeof renderLessons === "function") renderLessons();
  refreshNextLesson();
});
```

- [ ] **Step 4: Le reset efface aussi `lessons`**

Repère, dans le bloc `/* ---------- RESET ---------- */`, la ligne `ids.push("known","log","srs");` et la remplacer par :
```js
ids.push("known","log","srs","lessons");
```

- [ ] **Step 5: Vérification (cohérence)**

Relis ton diff : `parcours-core.js` chargé avant le grand IIFE ; `LESSONS`/`lessonsState`/`goTo`/`lessonDone`/`refreshNextLesson`/`lessonsReady` définis une fois après le bloc SRS ; `id="shadowing"` posé ; reset inclut `"lessons"`. `goTo` utilise `activateTab` (déjà défini dans le bloc NAV — hoisté). (`renderLessons` arrive en Task 4 ; les gardes `typeof renderLessons === "function"` gèrent l'attente.) Aucune vérif navigateur ici.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: runtime parcours guide (etat lessons, goTo, prochaine lecon)"
```

NOTE : ⚠️ commit uniquement `index.html` (jamais `-A`/`.`). Ne pas lancer le générateur audio ni `npm test` (rien de testable ici).

---

### Task 4: Onglet Parcours — rendu du fil + restructure (retrait jalons, calendrier replié)

**Files:**
- Modify: `index.html` (CSS du fil ; HTML de `#tab-parcours` ; fonction `renderLessons` + clic banner)

**Interfaces:**
- Consumes: `LESSONS`, `lessonsState`, `lessonsReady`, `goTo`, `lessonDone`, `window.ParcoursCore`, `$`/`$$`.
- Produces: `renderLessons()` (portée du grand IIFE).

- [ ] **Step 1: CSS du fil**

Repère, dans `<style>`, la fin du bloc lié au Parcours (par ex. après la règle `.goal-chip{...}`). Ajouter :

```css
  .next-lesson{display:flex;align-items:center;gap:12px;background:#15564C;color:#fff;border-radius:14px;padding:15px 18px;margin-bottom:18px;cursor:pointer}
  .next-lesson .nl-label{font-family:"Space Mono",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9fd3c8}
  .next-lesson .next-lesson-title{font-family:"Fraunces",serif;font-size:19px;font-weight:600}
  .lesson{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin-bottom:12px}
  .lesson.next{border-color:var(--jade);box-shadow:0 0 0 2px rgba(46,139,121,.2)}
  .lesson.done{opacity:.7}
  .lesson-head{display:flex;gap:12px;align-items:flex-start}
  .lesson-badge{flex:0 0 auto;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;background:rgba(46,139,121,.12);color:var(--ocean)}
  .lesson.done .lesson-badge{background:var(--jade);color:#fff}
  .lesson h4{font-size:18px;margin:0}
  .lesson-goal{font-size:14px;color:var(--muted);margin:4px 0 0}
  .lesson-steps{margin:14px 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
  .lesson-steps li{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:14.5px;color:#3a4a43}
  .lesson-steps .btn{flex:0 0 auto;padding:6px 12px;font-size:12px;white-space:nowrap}
  .lesson-done{font-size:13px}
```

- [ ] **Step 2: Ajouter le bloc « Ton fil guidé » en haut du Parcours**

Repère l'ouverture du panneau Parcours : `<section class="panel" id="tab-parcours">` suivi de `<section class="block">` (le bloc « 01 · Le parcours en 3 phases »). Juste **après** `<section class="panel" id="tab-parcours">` et **avant** ce premier `<section class="block">`, insérer :

```html
  <section class="block">
    <div class="block-head"><span class="num">★</span><h2>Ton fil guidé</h2></div>
    <p class="intro">Suis les leçons dans l'ordre. Chaque étape te dit où aller et quoi faire — clique « → Aller » pour t'y rendre, puis « Marquer comme fait ».</p>
    <div class="next-lesson" id="next-lesson"><span><span class="nl-label">Prochaine leçon</span><br><span class="next-lesson-title">…</span></span></div>
    <div id="lessons-mount"></div>
    <p class="intro" style="margin-top:10px">📅 Les leçons des <b>Phases 2 et 3</b> arrivent bientôt — en attendant, la vue d'ensemble et l'auto-évaluation « Je peux… » sont plus bas.</p>
  </section>
```

- [ ] **Step 3: Retirer les 3 blocs de jalons**

Dans les 3 `<div class="phase">`, supprime **uniquement** le bloc des jalons (garde les `.checks.cando`). Pour chaque phase, supprime le `<div class="checks" data-phase="p1">…</div>` (puis `p2`, puis `p3`) — c'est-à-dire le bloc dont l'en-tête est « Jalons · Phase N ». **Ne touche pas** aux `<div class="checks cando" data-phase="c1|c2|c3">` (« Je peux… »), ni aux `<div class="pcol">` (grammaire/vocabulaire à poser).

- [ ] **Step 4: Replier le calendrier 36 semaines**

Repère le bloc `<section class="block">` qui contient `<h2>Calendrier · 36 semaines</h2>`. Enveloppe son contenu dans un `<details>` : juste après le `<div class="block-head">…</div>`, ouvre `<details><summary class="intro" style="cursor:pointer">📅 Voir le calendrier semaine par semaine (vue d'ensemble)</summary>` et ferme `</details>` juste avant la fin de ce `<section class="block">`. (Le `<p class="intro">`, les chips de filtre et `#cal-mount` restent à l'intérieur du `<details>`.)

- [ ] **Step 5: Ajouter `renderLessons` + le clic du banner**

Repère le bloc `/* ---------- CALENDRIER 36 SEMAINES ---------- */` (l'IIFE qui monte le calendrier). Juste **avant** ce bloc, insérer :

```js
/* ---------- RENDU DU FIL GUIDÉ ---------- */
function renderLessons(){
  var m=$("#lessons-mount"); if(!m) return;
  var nextId=window.ParcoursCore.nextLessonId(LESSON_IDS, lessonsState);
  m.innerHTML="";
  LESSONS.forEach(function(l){
    var done=window.ParcoursCore.isLessonDone(lessonsState, l.id);
    var isNext=(l.id===nextId);
    var card=document.createElement("div");
    card.className="lesson"+(done?" done":"")+(isNext?" next":"");
    var badge=done?"✓":(isNext?"▶":"○");
    var steps="";
    l.steps.forEach(function(s){
      var t=s.target||{};
      steps+='<li><span>'+s.text+'</span> <button class="btn ghost lesson-go" data-tab="'+t.tab+'"'+
        (t.theme?' data-theme="'+t.theme.replace(/"/g,"")+'"':'')+
        (t.anchor?' data-anchor="'+t.anchor+'"':'')+'>→ Aller</button></li>';
    });
    card.innerHTML='<div class="lesson-head"><span class="lesson-badge">'+badge+'</span>'+
      '<div><h4>'+l.title+'</h4><p class="lesson-goal">'+l.goal+'</p></div></div>'+
      '<ul class="lesson-steps">'+steps+'</ul>'+
      '<button class="btn lesson-done">'+(done?"✓ Fait — annuler":"✓ Marquer comme fait")+'</button>';
    card.querySelector(".lesson-done").addEventListener("click",function(){ lessonDone(l.id, !done); });
    $$(".lesson-go",card).forEach(function(b){
      b.addEventListener("click",function(){
        goTo({ tab:b.getAttribute("data-tab"), theme:b.getAttribute("data-theme")||undefined, anchor:b.getAttribute("data-anchor")||undefined });
      });
    });
    m.appendChild(card);
  });
}
(function(){
  var banner=$("#next-lesson");
  if(banner) banner.addEventListener("click",function(){ var el=$(".lesson.next"); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); });
})();
```

(Comme `renderLessons` est une déclaration de fonction dans le grand IIFE, elle est hoistée : l'appel déjà présent dans `lessonsReady.then` — Task 3 — la trouvera au chargement.)

- [ ] **Step 6: Vérification (cohérence)**

Relis ton diff : le bloc « Ton fil guidé » est au début de `#tab-parcours` ; les 3 blocs jalons sont retirés (cando conservés) ; le calendrier est dans un `<details>` ; `renderLessons` bâtit les cartes depuis `LESSONS`, câble `goTo` (boutons « → Aller ») et `lessonDone` ; le banner scrolle vers `.lesson.next`. (Vérif navigateur — liens, marquage, repli — par le contrôleur/l'utilisateur.)

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: onglet Parcours - fil de lecons (rendu + liens) + calendrier replie, jalons retires"
```

NOTE : ⚠️ commit uniquement `index.html`. Ne lance pas le générateur ni `npm test`.

---

### Task 5: Encart « Prochaine leçon » sur l'accueil

**Files:**
- Modify: `index.html` (HTML accueil + vérif jauge)

**Interfaces:** Consumes `refreshNextLesson` (déjà appelée au chargement par `lessonsReady`, Task 3) ; met à jour un élément `.next-lesson-title` ajouté ici.

- [ ] **Step 1: Ajouter le banner sur l'accueil**

Dans `#tab-home`, repère la fin du `<header class="hero">…</header>` (juste après la fermeture de `.hero-meta` et avant `</header>`). Insère, à l'intérieur du `<header class="hero">`, juste après `</div>` de `.hero-meta` :

```html
    <div class="next-lesson" id="next-lesson-home" style="margin-top:22px"><span><span class="nl-label">Ta prochaine leçon</span><br><span class="next-lesson-title">…</span></span></div>
```

- [ ] **Step 2: Faire pointer le banner accueil vers le Parcours**

Repère le bloc `/* ---------- TUILE RÉVISION ---------- */`. Juste **après** ce bloc, ajouter :

```js
/* ---------- BANNER PROCHAINE LEÇON (accueil) ---------- */
(function(){
  var b=$("#next-lesson-home"); if(!b) return;
  b.style.cursor="pointer";
  b.addEventListener("click",function(){ var t=$('#nav button[data-tab="parcours"]'); if(t) t.click(); });
})();
```

(Le texte est rempli par `refreshNextLesson()` qui cible **tous** les `.next-lesson-title` — donc le banner accueil et celui du Parcours sont synchronisés automatiquement.)

- [ ] **Step 3: Vérification (cohérence + jauge)**

Relis ton diff : `#next-lesson-home` est dans le hero, contient un `.next-lesson-title` ; clic → onglet Parcours. Vérifie aussi que la jauge « % parcours validé » de l'accueil — qui compte les `.task` — ne compte plus que les cases « Je peux… » (les jalons ayant été retirés en Task 4). (Vérif chiffrée en navigateur par le contrôleur.)

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: encart 'prochaine lecon' sur l'accueil"
```

NOTE : ⚠️ commit uniquement `index.html`.

---

## Notes de fin
- **Phases 2 & 3** : ajouter leurs leçons dans `data.js` (`lessons`) suffira — le moteur et le rendu les prennent sans changement.
- Penser à **bumper `CACHE` dans `sw.js`** (ex. `bahasa-v4`) au moment du déploiement pour que la PWA récupère la nouvelle version (étape de déploiement, hors tâches ci-dessus).
- Vérification navigateur recommandée sur l'URL GitHub Pages après merge (voir spec §Vérification).
