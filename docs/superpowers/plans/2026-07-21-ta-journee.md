# « Ta journée » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer l'onglet Challenge en QG quotidien guidé : 5 tâches concrètes par jour (une par pilier), tirées de la leçon du jour ou de la consolidation, cliquables et cochables ; gamification repliée ; carte « Ta journée » sur l'accueil.

**Architecture:** Nouveau module pur `journee-core.js` (UMD, testé) qui construit le plan du jour à partir de la leçon courante (`ParcoursCore.nextLessonId`) + contexte (cartes SRS dues, prompt du jour). `data.js` gagne un champ `pillar` par étape de leçon. `index.html` re-rend l'onglet Challenge (checklist héros + `<details>` progression) et remplace le mini-encart accueil + l'encart « prochaine leçon » par une carte CTA. Le moteur `challenge-core.js` est **inchangé**.

**Tech Stack:** JavaScript vanilla ES5 (cores UMD), `node:test`, localStorage `Store`, PWA `sw.js`.

## Global Constraints

- Ordre des piliers figé : `["study","read","listen","speak","journal"]` ; libellés FR : Étudier / Lire / Écouter / Parler / Journal.
- `challenge-core.js` **ne change pas** ; journée pleine = 5 piliers (`CH.dayComplete`), XP/streak/badges inchangés.
- Style modules : UMD ES5 comme les autres `*-core.js`.
- Design : tokens « Tropiques vivants » existants (`--ocean` jade, `--merah` hibiscus, `--sun`, `--ink`, `--line`, `--r`…) ; flat (pas d'ombre) ; SVG signature `#ic-bloom`/`#ic-sprout` + `.bloom-in` déjà présents.
- **Détection auto** honnête : une tâche est `auto` seulement si l'activité déclenche réellement un hook — `read` si `target.tab==="vocab"` ou `target.anchor==="quiz-voc"` (→ `srsUpdate`) ; `listen` si `target.anchor==="quiz-listen"`. Tout le reste = bouton manuel « ✓ Fait ».
- Prompt du jour **déterministe** (même prompt toute la journée) : index = somme des charCodes de `dayISO` modulo la taille du pool.
- **SW : bump `bahasa-v7`** (v6 pris par le reskin) + précache `journee-core.js`.
- `npm test` vert à chaque tâche ; script inline parse (`new Function`) après toute édition d'`index.html`.

---

## File Structure

- **Create** `journee-core.js` — plan du jour pur (pillarForStep, defaultTaskFor, autoForTask, buildDayPlan).
- **Create** `tests/journee-core.test.js`.
- **Modify** `data.js` — champ `pillar` sur chaque étape des 7 leçons.
- **Modify** `tests/data.test.js` — assertion : chaque étape a un `pillar` valide.
- **Modify** `index.html` — panneau Challenge (checklist + `<details>`), CSS, bloc JS CHALLENGE 75 (rendu), prompts extraits en global, carte accueil, retrait encart « prochaine leçon » accueil.
- **Modify** `sw.js` — v7 + précache.

---

## Task 1 : `journee-core.js` + tests

**Files:**
- Create: `journee-core.js`
- Test: `tests/journee-core.test.js`

**Interfaces:**
- Consumes : rien (autonome).
- Produces (`window.JourneeCore` / `module.exports`) :
  - `PILLARS`, `PILLAR_LABELS`
  - `pillarForStep(step) -> pillar|null` (champ `step.pillar` prioritaire ; heuristique target en secours)
  - `autoForTask(pillar, target) -> boolean` (règles de détection ci-dessus)
  - `defaultTaskFor(pillar, ctx) -> {pillar,label,target,auto}` ; `ctx = {srsDue, prompt}`
  - `buildDayPlan(lesson, ctx) -> [task x5]` (ordre figé ; étape de leçon si dispo pour ce pilier sinon défaut ; `lesson` peut être `null`)

- [ ] **Step 1 : Écrire les tests (qui échouent)**

Create `tests/journee-core.test.js` :

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const JC = require("../journee-core.js");

const CTX = { srsDue: 12, prompt: "Présente-toi." };

test("PILLARS et labels", () => {
  assert.deepStrictEqual(JC.PILLARS, ["study","read","listen","speak","journal"]);
  assert.strictEqual(JC.PILLAR_LABELS.read, "Lire");
});

test("pillarForStep: champ explicite prioritaire", () => {
  assert.strictEqual(JC.pillarForStep({ pillar:"speak", target:{tab:"grammaire"} }), "speak");
});

test("pillarForStep: heuristique target en secours", () => {
  assert.strictEqual(JC.pillarForStep({ target:{tab:"grammaire"} }), "study");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"vocab", theme:"X"} }), "read");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"phrases"} }), "read");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"training", anchor:"quiz-listen"} }), "listen");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"prononciation", anchor:"shadowing"} }), "speak");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"prononciation"} }), "speak");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"carnet"} }), "journal");
  assert.strictEqual(JC.pillarForStep({}), null);
});

test("autoForTask: seulement les activites reellement detectees", () => {
  assert.strictEqual(JC.autoForTask("read", {tab:"vocab"}), true);
  assert.strictEqual(JC.autoForTask("read", {tab:"training", anchor:"quiz-voc"}), true);
  assert.strictEqual(JC.autoForTask("read", {tab:"phrases"}), false);
  assert.strictEqual(JC.autoForTask("listen", {tab:"training", anchor:"quiz-listen"}), true);
  assert.strictEqual(JC.autoForTask("listen", {tab:"prononciation"}), false);
  assert.strictEqual(JC.autoForTask("study", {tab:"grammaire"}), false);
  assert.strictEqual(JC.autoForTask("speak", {tab:"carnet"}), false);
});

test("defaultTaskFor: read injecte srsDue, speak injecte prompt", () => {
  const r = JC.defaultTaskFor("read", CTX);
  assert.ok(r.label.indexOf("12") >= 0);
  assert.deepStrictEqual(r.target, { tab:"vocab" });
  assert.strictEqual(r.auto, true);
  const s = JC.defaultTaskFor("speak", CTX);
  assert.ok(s.label.indexOf("Présente-toi.") >= 0);
  assert.strictEqual(s.auto, false);
  const l = JC.defaultTaskFor("listen", CTX);
  assert.deepStrictEqual(l.target, { tab:"training", anchor:"quiz-listen" });
  assert.strictEqual(l.auto, true);
  const st = JC.defaultTaskFor("study", CTX);
  assert.deepStrictEqual(st.target, { tab:"grammaire" });
  const j = JC.defaultTaskFor("journal", CTX);
  assert.deepStrictEqual(j.target, { tab:"carnet" });
});

test("buildDayPlan: 5 taches dans l'ordre, lecon prioritaire, defauts en complement", () => {
  const lesson = { id:"x", title:"T", steps: [
    { text:"Apprends les cartes.", target:{tab:"vocab", theme:"X"}, pillar:"read" },
    { text:"Lis la grammaire.", target:{tab:"grammaire"}, pillar:"study" },
    { text:"Dis-le a voix haute.", target:{tab:"carnet"}, pillar:"speak" }
  ]};
  const plan = JC.buildDayPlan(lesson, CTX);
  assert.strictEqual(plan.length, 5);
  assert.deepStrictEqual(plan.map(t => t.pillar), JC.PILLARS);
  assert.strictEqual(plan[0].label, "Lis la grammaire.");        // study <- lecon
  assert.strictEqual(plan[1].label, "Apprends les cartes.");     // read <- lecon
  assert.ok(plan[2].label.length > 0);                            // listen <- defaut
  assert.strictEqual(plan[2].auto, true);
  assert.strictEqual(plan[3].label, "Dis-le a voix haute.");     // speak <- lecon
  assert.strictEqual(plan[3].auto, false);
  assert.ok(plan[4].target.tab === "carnet");                     // journal <- defaut
});

test("buildDayPlan: premiere etape par pilier seulement", () => {
  const lesson = { steps: [
    { text:"A", target:{tab:"vocab"}, pillar:"read" },
    { text:"B", target:{tab:"phrases"}, pillar:"read" }
  ]};
  const plan = JC.buildDayPlan(lesson, CTX);
  assert.strictEqual(plan[1].label, "A");
});

test("buildDayPlan: lesson null => consolidation (5 defauts)", () => {
  const plan = JC.buildDayPlan(null, CTX);
  assert.strictEqual(plan.length, 5);
  assert.ok(plan.every(t => t.label && t.target));
  assert.strictEqual(plan[1].auto, true);   // read defaut
  assert.strictEqual(plan[2].auto, true);   // listen defaut
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npm test` → FAIL `Cannot find module '../journee-core.js'`.

- [ ] **Step 3 : Écrire le module**

Create `journee-core.js` :

```js
(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.JourneeCore = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PILLARS = ["study", "read", "listen", "speak", "journal"];
  var PILLAR_LABELS = { study: "Étudier", read: "Lire", listen: "Écouter", speak: "Parler", journal: "Journal" };

  function pillarForStep(step) {
    if (!step) return null;
    if (step.pillar && PILLARS.indexOf(step.pillar) >= 0) return step.pillar;
    var t = step.target || {};
    if (t.anchor === "quiz-listen") return "listen";
    if (t.tab === "grammaire") return "study";
    if (t.tab === "vocab" || t.tab === "phrases") return "read";
    if (t.tab === "prononciation") return "speak";
    if (t.tab === "carnet") return "journal";
    return null;
  }

  function autoForTask(pillar, target) {
    var t = target || {};
    if (pillar === "read") return t.tab === "vocab" || t.anchor === "quiz-voc";
    if (pillar === "listen") return t.anchor === "quiz-listen";
    return false;
  }

  function defaultTaskFor(pillar, ctx) {
    ctx = ctx || {};
    var due = ctx.srsDue == null ? 0 : ctx.srsDue;
    var prompt = ctx.prompt || "Parle 2 minutes à voix haute.";
    var label, target;
    if (pillar === "study") { label = "Relis un point de grammaire."; target = { tab: "grammaire" }; }
    else if (pillar === "read") { label = "Révise tes cartes (" + due + " dues)."; target = { tab: "vocab" }; }
    else if (pillar === "listen") { label = "Quiz d'écoute (5 questions)."; target = { tab: "training", anchor: "quiz-listen" }; }
    else if (pillar === "speak") { label = "Dis à voix haute : « " + prompt + " »"; target = { tab: "carnet" }; }
    else { label = "Écris 2 phrases (journal)."; target = { tab: "carnet" }; }
    return { pillar: pillar, label: label, target: target, auto: autoForTask(pillar, target) };
  }

  function buildDayPlan(lesson, ctx) {
    var steps = (lesson && lesson.steps) || [];
    var plan = [];
    for (var i = 0; i < PILLARS.length; i++) {
      var pillar = PILLARS[i], found = null;
      for (var j = 0; j < steps.length; j++) {
        if (pillarForStep(steps[j]) === pillar) { found = steps[j]; break; }
      }
      if (found) {
        plan.push({ pillar: pillar, label: found.text, target: found.target || {}, auto: autoForTask(pillar, found.target || {}) });
      } else {
        plan.push(defaultTaskFor(pillar, ctx));
      }
    }
    return plan;
  }

  return { PILLARS: PILLARS, PILLAR_LABELS: PILLAR_LABELS, pillarForStep: pillarForStep, autoForTask: autoForTask, defaultTaskFor: defaultTaskFor, buildDayPlan: buildDayPlan };
});
```

- [ ] **Step 4 : Vérifier**

Run: `npm test` → tous verts (42 existants + nouveaux).

- [ ] **Step 5 : Commit**
```bash
git add journee-core.js tests/journee-core.test.js
git commit -m "feat: journee-core (plan du jour guide) + tests"
```

---

## Task 2 : `data.js` — tags `pillar` + test

**Files:**
- Modify: `data.js` (leçons [data.js:118-170](../../../data.js#L118-L170))
- Modify: `tests/data.test.js`

**Interfaces:**
- Consumes : `JourneeCore.PILLARS` (pour le test).
- Produces : chaque étape de leçon porte `pillar`.

- [ ] **Step 1 : Test (échoue d'abord)**

Ajouter à `tests/data.test.js` :
```js
test("lessons: chaque etape a un pilier valide", () => {
  const PILLARS = ["study","read","listen","speak","journal"];
  assert.ok(Array.isArray(DATA.lessons) && DATA.lessons.length >= 7);
  for (const l of DATA.lessons) {
    for (const s of l.steps) {
      assert.ok(PILLARS.includes(s.pillar), l.id + " : etape sans pilier valide -> " + s.text);
    }
  }
});
```
Run: `npm test` → ce test FAIL (pas encore de champ `pillar`).

- [ ] **Step 2 : Tagger les 28 étapes**

Dans `data.js`, ajouter `pillar` à chaque étape (après `target`) :
- **p1-l1** : step1 (voyelles/consonnes + écoute) → `pillar:"study"` ; step2 (shadowing) → `"speak"`.
- **p1-l2** : cartes salutations → `"read"` ; phrases à voix haute → `"speak"` ; quiz vocab → `"study"`.
- **p1-l3** : cartes personnes → `"read"` ; grammaire ossature → `"study"` ; phrases sympathiser → `"read"` ; prompt présente-toi → `"speak"`.
- **p1-l4** : cartes nombres → `"read"` ; quiz nombres → `"study"` ; cartes argent → `"read"` ; phrases se débrouiller → `"read"`.
- **p1-l5** : cartes nourriture → `"read"` ; drill saya mau → `"study"` ; dialogue warung à voix haute → `"speak"`.
- **p1-l6** : grammaire dire non → `"study"` ; grammaire questions → `"study"` ; drill di mana → `"study"`.
- **p1-l7** : grammaire temps → `"study"` ; cartes temps → `"read"` ; drill sudah → `"study"` ; prompt raconte hier → `"speak"`.

Exemple (l2 step1) : `{ text: "Apprends les cartes du thème « Salutations & politesse ».", target: { tab: "vocab", theme: "Salutations & politesse" }, pillar: "read" },`

- [ ] **Step 3 : Vérifier**

Run: `npm test` → tout vert.

- [ ] **Step 4 : Commit**
```bash
git add data.js tests/data.test.js
git commit -m "feat: tags pillar sur les etapes de lecons (donnees du plan du jour)"
```

---

## Task 3 : Onglet Challenge — checklist héros + progression repliée

**Files:**
- Modify: `index.html` — script include ; panneau `#tab-challenge` ([:500-505](../../../index.html#L500-L505)) ; CSS ; bloc JS CHALLENGE 75 ([:1123-1254](../../../index.html#L1123-L1254)) ; prompts ([:1738-1757](../../../index.html#L1738-L1757))

**Interfaces:**
- Consumes : `JourneeCore` (T1), tags `pillar` (T2), `CH`, `markPillar`, `goTo`, `lessonsState`/`LESSON_IDS`/`LESSONS`, `SrsCore.dueIds`, `FLAT`, `todayISO`, SVG `#ic-bloom`.
- Produces : `EXPRESSION_PROMPTS` (global), `promptForDay(iso)`, nouveau `renderChallenge()` ; celebration 5/5 dans `markPillar`.

- [ ] **Step 1 : Charger le module**

Après `<script src="challenge-core.js"></script>`, ajouter :
```html
<script src="journee-core.js"></script>
```

- [ ] **Step 2 : Extraire les prompts en global**

Dans le bloc `/* ---------- PROMPTS D'EXPRESSION ---------- */` ([:1738](../../../index.html#L1738)) : sortir le tableau de l'IIFE en le déclarant juste AVANT elle :
```js
var EXPRESSION_PROMPTS = [ /* ...les 15 prompts existants, inchangés... */ ];
```
et dans l'IIFE remplacer `var prompts=[...]` par `var prompts=EXPRESSION_PROMPTS;`.

- [ ] **Step 3 : Panneau — checklist + details**

Remplacer le contenu du panneau ([:500-505](../../../index.html#L500-L505)) par :
```html
<section class="panel" id="tab-challenge">
  <div class="block-head"><span class="num">75</span><h2>Challenge 75</h2></div>
  <div id="ch-cockpit" class="ch-cockpit"></div>
  <details class="ch-more">
    <summary>Voir ma progression</summary>
    <div id="ch-grid" class="ch-grid"></div>
    <div id="ch-badges" class="ch-badges"></div>
  </details>
</section>
```
(Le `<p class="intro">` explicatif disparaît — la checklist se suffit.)

- [ ] **Step 4 : CSS de la checklist (remplacer le CSS des anneaux)**

Dans le bloc CSS `/* --- Challenge 75 --- */` : **supprimer** les règles `.ch-rings`, `.ch-ring`, `.ch-ring-dot`, `.ch-ring-lbl`, `.ch-manual-hint` et **ajouter** :
```css
.ch-day-head{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:4px}
.ch-day-title{font-size:clamp(20px,3vw,26px)}
.ch-day-meta{margin-left:auto;display:flex;gap:14px;align-items:baseline}
.ch-day-meta .streak{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:22px}
.ch-day-meta .xp{font-weight:700;color:var(--jade);font-size:14px}
.ch-day-count{font-weight:700;color:var(--muted);font-size:13px}
.ch-tasks{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.ch-task{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:12px 14px}
.ch-task.done{border-color:rgba(15,184,143,.45);background:rgba(15,184,143,.07)}
.ch-task .tk-state{flex:0 0 auto;width:26px;height:26px;border-radius:50%;border:2px solid var(--line-strong);display:flex;align-items:center;justify-content:center;color:var(--hibiscus)}
.ch-task.done .tk-state{border-color:var(--ocean);background:#fff}
.ch-task .tk-body{flex:1 1 auto;min-width:0}
.ch-task .tk-pillar{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.ch-task.done .tk-pillar{color:var(--jade)}
.ch-task .tk-label{font-size:14.5px}
.ch-task.done .tk-label{color:var(--muted)}
.ch-task .tk-actions{flex:0 0 auto;display:flex;gap:8px}
.ch-task .tk-go{font-size:12px;font-weight:700;border:1px solid var(--line-strong);background:#fff;color:var(--ink);padding:7px 12px;border-radius:var(--r-pill);cursor:pointer;transition:.15s}
.ch-task .tk-go:hover{border-color:var(--ocean);color:var(--jade)}
.ch-task .tk-done-btn{font-size:12px;font-weight:700;border:none;background:var(--ocean);color:#fff;padding:8px 13px;border-radius:var(--r-pill);cursor:pointer}
.ch-task.done .tk-done-btn{background:none;border:1px solid var(--line);color:var(--muted)}
.ch-task .tk-auto{font-size:11px;font-weight:700;color:var(--muted)}
.ch-more{margin:18px 0}
.ch-more summary{cursor:pointer;font-weight:700;color:var(--jade);padding:10px 0}
@media (max-width:640px){ .ch-task{flex-wrap:wrap} .ch-task .tk-actions{width:100%;justify-content:flex-end} }
```

- [ ] **Step 5 : Nouveau rendu JS**

Dans le bloc CHALLENGE 75 : **supprimer** `ringHTML` ([:1163-1169](../../../index.html#L1163-L1169)) et remplacer **entièrement** `renderChallenge()` ([:1171-1198](../../../index.html#L1171-L1198)) par :
```js
function lessonById(id){ for(var i=0;i<LESSONS.length;i++){ if(LESSONS[i].id===id) return LESSONS[i]; } return null; }
function promptForDay(iso){
  var s=0; for(var i=0;i<iso.length;i++) s+=iso.charCodeAt(i);
  return EXPRESSION_PROMPTS[s % EXPRESSION_PROMPTS.length];
}
function taskRowHTML(t, done){
  var stateIcon = done ? '<svg class="ic-botanic bloom-in" aria-hidden="true"><use href="#ic-bloom"/></svg>' : '';
  var actions = '';
  if(t.target && t.target.tab) actions += '<button class="tk-go" data-i="__I__">→ Aller</button>';
  if(t.auto) actions += '<span class="tk-auto">⚡ auto</span>';
  else actions += '<button class="tk-done-btn" data-p="'+t.pillar+'">'+(done?'Annuler':'✓ Fait')+'</button>';
  return '<li class="ch-task'+(done?' done':'')+'">'
    + '<span class="tk-state">'+stateIcon+'</span>'
    + '<span class="tk-body"><span class="tk-pillar">'+window.JourneeCore.PILLAR_LABELS[t.pillar]+'</span><br><span class="tk-label">'+t.label+'</span></span>'
    + '<span class="tk-actions">'+actions+'</span></li>';
}
function renderChallenge(){
  if(!CH || !window.JourneeCore) return;
  var cp = document.getElementById("ch-cockpit");
  if(cp){
    var today = todayISO();
    var day = CH.dayPillars(challenge, today);
    var doneCount = CH.dayCount(day);
    var lessonId = window.ParcoursCore.nextLessonId(LESSON_IDS, lessonsState);
    var lesson = lessonById(lessonId);
    var srsDue = window.SrsCore.dueIds(srs, FLAT.map(function(x){ return x.id; }), today).length;
    var plan = window.JourneeCore.buildDayPlan(lesson, { srsDue: srsDue, prompt: promptForDay(today) });
    var title = lesson ? ("Leçon — " + lesson.title) : "Consolidation";
    var rows = "";
    for(var i=0;i<plan.length;i++){
      rows += taskRowHTML(plan[i], !!day[plan[i].pillar]).replace("__I__", String(i));
    }
    cp.innerHTML =
      '<div class="ch-day-head">'
      + '<div><div class="tk-pillar">Ta journée</div><h3 class="ch-day-title">'+title+'</h3></div>'
      + '<div class="ch-day-meta"><span class="streak">🔥 '+CH.streak(challenge, today)+'</span>'
      + '<span class="xp">'+CH.xpForDay(day)+'/70 XP</span>'
      + '<span class="ch-day-count">'+doneCount+'/5</span></div>'
      + '</div>'
      + '<ul class="ch-tasks">'+rows+'</ul>';
    $$(".tk-go", cp).forEach(function(b){
      b.addEventListener("click", function(){ var t = plan[+b.getAttribute("data-i")]; if(t) goTo(t.target); });
    });
    $$(".tk-done-btn", cp).forEach(function(b){
      b.addEventListener("click", function(){
        var p = b.getAttribute("data-p");
        markPillar(p, !CH.dayPillars(challenge, todayISO())[p]);
      });
    });
  }
  renderChallengeGrid();
  renderChallengeBadges();
}
```
(`renderChallengeGrid`/`renderChallengeBadges` sont inchangés — leurs mounts vivent maintenant dans le `<details>`.)

- [ ] **Step 6 : Célébration 5/5 dans `markPillar`**

Dans `markPillar` ([:1152-1161](../../../index.html#L1152-L1161)), capturer l'état avant/après et fêter le passage à 5/5. Remplacer le corps par :
```js
function markPillar(pillar, value){
  if(!CH || CH.PILLARS.indexOf(pillar) < 0) return;
  var today = todayISO();
  var before = CH.badgesUnlocked(challenge);
  var wasFull = CH.dayComplete(CH.dayPillars(challenge, today));
  challenge = CH.setPillar(challenge, today, pillar, value === undefined ? true : value);
  saveChallenge();
  renderChallenge();
  refreshChallengeMini();
  if(!wasFull && CH.dayComplete(CH.dayPillars(challenge, today))){
    var t = document.createElement("div");
    t.className = "ch-toast";
    t.innerHTML = '<svg class="ic-botanic bloom-in" aria-hidden="true"><use href="#ic-bloom"/></svg> Journée pleine · <b>+70 XP</b> 🎉';
    document.body.appendChild(t);
    setTimeout(function(){ t.classList.add("show"); }, 20);
    setTimeout(function(){ t.classList.remove("show"); setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 300); }, 3200);
  }
  CH.badgesUnlocked(challenge).filter(function(b){ return before.indexOf(b) < 0; }).forEach(showBadgeToast);
}
```

- [ ] **Step 7 : Vérifier**

Run: `npm test` → vert. Parse inline (`new Function` sur les 2 blocs) → OK.
`grep -n "ch-ring" index.html` → 0 occurrence (anneaux supprimés, CSS compris).

- [ ] **Step 8 : Commit**
```bash
git add index.html
git commit -m "feat: onglet Challenge = plan du jour guide (checklist heros, progression repliee, celebration 5/5)"
```

---

## Task 4 : Accueil — carte « Ta journée »

**Files:**
- Modify: `index.html` — `#ch-mini` ([:357](../../../index.html#L357)), encart `#next-lesson-home` ([:371](../../../index.html#L371)), `refreshChallengeMini()` ([:1233-1248](../../../index.html#L1233-L1248)), CSS `.ch-mini*`

**Interfaces:**
- Consumes : `CH`, `challenge`, `lessonById`, `LESSON_IDS`, `lessonsState`, `todayISO`, `activateTab`.

- [ ] **Step 1 : Markup — carte à la place du bouton à ronds**

Remplacer la ligne [:357](../../../index.html#L357) par :
```html
  <button id="ch-mini" class="ch-day-card" aria-label="Ouvrir le Challenge 75"></button>
```
Et **supprimer** la ligne de l'encart `#next-lesson-home` ([:371](../../../index.html#L371)) — le Parcours garde son propre encart `#next-lesson`, et le binding JS de `#next-lesson-home` ([:996](../../../index.html#L996)) est déjà gardé par `if(!b) return;`.

- [ ] **Step 2 : CSS — remplacer `.ch-mini*` par `.ch-day-card*`**

Supprimer les règles `.ch-mini`, `.ch-mini-streak`, `.ch-mini-dot`, `.ch-mini-dot.on`, `.ch-mini-xp` et ajouter :
```css
.ch-day-card{display:flex;align-items:center;gap:16px;width:100%;max-width:560px;text-align:left;background:var(--card);border:1px solid var(--line);border-left:4px solid var(--ocean);border-radius:var(--r);padding:14px 18px;cursor:pointer;font-family:inherit;margin:18px 0 0;transition:transform .15s ease,border-color .15s ease}
.ch-day-card:hover{transform:translateY(-2px);border-color:var(--line-strong);border-left-color:var(--ocean)}
.ch-day-card .dc-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.ch-day-card .dc-title{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:18px;color:var(--ink)}
.ch-day-card .dc-meta{margin-left:auto;display:flex;gap:12px;align-items:baseline;flex:0 0 auto}
.ch-day-card .dc-streak{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:18px}
.ch-day-card .dc-count{font-weight:700;font-size:13px;color:var(--jade)}
.ch-day-card .dc-cta{font-weight:800;font-size:13px;color:#fff;background:var(--merah);padding:8px 14px;border-radius:var(--r-pill)}
@media (prefers-reduced-motion: reduce){ .ch-day-card:hover{transform:none} }
```

- [ ] **Step 3 : Rendu — `refreshChallengeMini` devient la carte**

Remplacer le corps de `refreshChallengeMini()` ([:1233-1248](../../../index.html#L1233-L1248)) par :
```js
function refreshChallengeMini(){
  var mount = document.getElementById("ch-mini");
  if(!mount || !CH) return;
  var today = todayISO();
  var day = CH.dayPillars(challenge, today);
  var doneCount = CH.dayCount(day);
  var full = CH.dayComplete(day);
  var lessonId = window.ParcoursCore.nextLessonId(LESSON_IDS, lessonsState);
  var lesson = (typeof lessonById === "function") ? lessonById(lessonId) : null;
  var title = full ? "✅ Journée faite — à demain !" : (lesson ? lesson.title : "Consolidation");
  var cta = full ? "Voir" : (doneCount > 0 ? "Continuer →" : "Commencer →");
  mount.innerHTML = '<span><span class="dc-label">Ta journée</span><br><span class="dc-title">'+title+'</span></span>'
    + '<span class="dc-meta"><span class="dc-streak">🔥 '+CH.streak(challenge, today)+'</span>'
    + '<span class="dc-count">'+doneCount+'/5</span>'
    + '<span class="dc-cta">'+cta+'</span></span>';
  if(!mount.dataset.bound){
    mount.addEventListener("click", function(){ activateTab("challenge"); });
    mount.dataset.bound = "1";
  }
}
```

- [ ] **Step 4 : Vérifier**

Run: `npm test` → vert. Parse inline OK. `grep -n "ch-mini-dot\|next-lesson-home" index.html` → 0.

- [ ] **Step 5 : Commit**
```bash
git add index.html
git commit -m "feat: carte 'Ta journee' sur l'accueil (remplace ronds + encart prochaine lecon)"
```

---

## Task 5 : Service worker + balayage

**Files:**
- Modify: `sw.js`

- [ ] **Step 1 : Bump + précache**

`sw.js` : `var CACHE = "bahasa-v6";` → `"bahasa-v7"` ; dans `SHELL`, après `"./challenge-core.js",` ajouter `"./journee-core.js",`.

- [ ] **Step 2 : Vérifier**

Run: `npm test` → vert ; `node --check sw.js` → OK.
Relire `git diff` de la branche : pas de code mort restant (`ch-ring`, `ch-mini-dot`), `EXPRESSION_PROMPTS` défini une seule fois, ordre de définition OK (`lessonById` défini avant usage dans `refreshChallengeMini` — même scope de script, appels runtime uniquement).

- [ ] **Step 3 : Commit**
```bash
git add sw.js
git commit -m "feat: bump SW bahasa-v7 + precache journee-core"
```

---

## Self-Review (fait pendant la rédaction)

- **Couverture spec :** modèle 5 tâches/piliers (T1), tags data.js (T2), checklist héros + details progression + célébration (T3), carte accueil + retraits (T4), SW v7 (T5). Décisions plan tranchées : anneaux **supprimés** ; prompts **partagés via global + hash déterministe du jour**.
- **Honnêteté auto/manuel :** `autoForTask` ne marque ⚡ que ce que les hooks détectent réellement (vocab/quiz-voc → read ; quiz-listen → listen) ; tout le reste a « ✓ Fait ».
- **Cohérence types :** `buildDayPlan` → `{pillar,label,target,auto}` consommé tel quel par `taskRowHTML` ; `PILLAR_LABELS` (JourneeCore) remplace l'usage UI de `CH_LABELS` dans les nouveaux rendus (`CH_LABELS` reste utilisé nulle part ailleurs après T3/T4 — le laisser défini est sans effet).
- **Pièges vérifiés :** binding `#next-lesson-home` gardé (`if(!b) return`) ; `refreshNextLesson` (`$$(".next-lesson-title")`) fonctionne toujours pour l'encart du Parcours ; XSS non-problème (labels de data.js maîtrisés, prompts codés en dur) ; `plan` capturé en closure pour `tk-go` (pas d'attribut JSON).
