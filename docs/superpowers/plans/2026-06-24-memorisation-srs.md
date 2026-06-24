# Mémorisation (SRS Leitner) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une répétition espacée par paliers (Leitner) sur le vocabulaire, alimentée par les flashcards ET les quiz (vocab + écoute), avec révision du jour, tuile « à réviser » sur l'accueil et compteur de mots maîtrisés.

**Architecture:** La logique pure de paliers vit dans un nouveau module UMD `srs-core.js` (testé en Node). La page charge ce module et tient un état `srs` (`{id:{box,due}}`) persisté via `Store` (clé `srs`), mis à jour par une fonction unique `srsUpdate(id, knewIt)` appelée depuis les flashcards et les quiz. Les flashcards deviennent la « révision du jour » (cartes dues d'abord).

**Tech Stack:** HTML/CSS/JS vanilla ES5 (aucune dépendance runtime) ; Node.js + `node:test` pour la logique pure.

## Global Constraints

- **Aucune dépendance runtime** ; uniquement des fichiers locaux. ES5 (`var`, fonctions classiques, IIFE), helpers `$`/`$$`, persistance via l'objet `Store` existant.
- **Module `srs-core.js`** : UMD → `window.SrsCore` (navigateur) ET `module.exports` (Node).
- **Paliers → délais (jours)** : `BOX_DAYS = [0, 1, 3, 7, 16, 35, 120]` (index = palier 1..6 ; index 0 inutilisé).
- **`nextState(prev, knewIt, todayISO)`** : `base = prev ? prev.box : 1` ; `box = knewIt ? min(base+1, 6) : 1` ; `due = addDays(today, BOX_DAYS[box])`.
- **`isDue`** : carte jamais vue (`!state`) → due ; sinon `state.due <= todayISO`.
- **`dueIds`** : retours en retard d'abord (par `due` croissant), puis les jamais-vus.
- **Stockage** : clé `Store` `srs` = JSON `{ "<id>": {box,due} }`. Parse sous `try/catch` → `{}` si corrompu.
- **Migration** : si `srs` absent mais `known` présent → chaque id de `known` devient `{box:6, due:today+120}`. Une seule fois.
- **Périmètre** : vocabulaire (`FLAT`) uniquement. Quiz nombres **exclu** du SRS.
- **Dates** : `addDays` en UTC déterministe ; `todayISO()` = `new Date().toISOString().slice(0,10)`.

## Stratégie de test

- **Logique pure → tests automatisés** (`node:test`) sur `srs-core.js`.
- **DOM (page) → vérification manuelle navigateur** (le sous-agent fait les éditions + relit son diff ; la vérif interactive est faite par le contrôleur/l'utilisateur).
- Lancer les tests : `npm test`. Lancer la page : `npx serve .` ou ouvrir le fichier.

## Structure de fichiers (cible)

```
learnBahasa/
  srs-core.js          # NEW — logique paliers (UMD)
  tests/srs-core.test.js  # NEW
  plan-indonesien.html # modifié : <script srs-core>, runtime SRS, flashcards, hooks quiz, tuile accueil, stat carnet, reset
```

---

### Task 1: `srs-core.js` (logique pure) + tests

**Files:**
- Create: `srs-core.js`
- Test: `tests/srs-core.test.js`

**Interfaces:**
- Produces (`window.SrsCore` / `require("./srs-core.js")`) :
  - `intervalForBox(box:number) -> number`
  - `addDays(iso:string, n:number) -> string`
  - `nextState(prev:{box,due}|null, knewIt:boolean, todayISO:string) -> {box:number, due:string}`
  - `isDue(state:{box,due}|null|undefined, todayISO:string) -> boolean`
  - `dueIds(srsMap:object, allIds:string[], todayISO:string) -> string[]`
  - `masteredCount(srsMap:object) -> number`
  - `BOX_DAYS:number[]`

- [ ] **Step 1: Écrire le test (qui échoue)**

Create `tests/srs-core.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const S = require("../srs-core.js");

test("intervalForBox borne 1..6", () => {
  assert.strictEqual(S.intervalForBox(1), 1);
  assert.strictEqual(S.intervalForBox(6), 120);
  assert.strictEqual(S.intervalForBox(0), 1);
  assert.strictEqual(S.intervalForBox(9), 120);
});

test("addDays gère les changements de mois/an (UTC)", () => {
  assert.strictEqual(S.addDays("2026-06-24", 1), "2026-06-25");
  assert.strictEqual(S.addDays("2026-06-30", 1), "2026-07-01");
  assert.strictEqual(S.addDays("2026-12-31", 1), "2027-01-01");
  assert.strictEqual(S.addDays("2026-01-28", 35), "2026-03-04");
});

test("nextState: su monte et plafonne à 6", () => {
  assert.deepStrictEqual(S.nextState(null, true, "2026-06-24"), { box: 2, due: "2026-06-27" });
  assert.deepStrictEqual(S.nextState({ box: 5, due: "x" }, true, "2026-06-24"), { box: 6, due: S.addDays("2026-06-24", 120) });
  assert.deepStrictEqual(S.nextState({ box: 6, due: "x" }, true, "2026-06-24"), { box: 6, due: S.addDays("2026-06-24", 120) });
});

test("nextState: pas su retombe au palier 1 (+1 jour)", () => {
  assert.deepStrictEqual(S.nextState({ box: 5, due: "x" }, false, "2026-06-24"), { box: 1, due: "2026-06-25" });
  assert.deepStrictEqual(S.nextState(null, false, "2026-06-24"), { box: 1, due: "2026-06-25" });
});

test("isDue: jamais-vu dû; passé/aujourd'hui dû; futur non", () => {
  assert.strictEqual(S.isDue(null, "2026-06-24"), true);
  assert.strictEqual(S.isDue({ box: 1, due: "2026-06-24" }, "2026-06-24"), true);
  assert.strictEqual(S.isDue({ box: 1, due: "2026-06-20" }, "2026-06-24"), true);
  assert.strictEqual(S.isDue({ box: 2, due: "2026-06-30" }, "2026-06-24"), false);
});

test("dueIds: retards d'abord (due asc) puis jamais-vus; futur exclu", () => {
  const map = {
    a: { box: 2, due: "2026-06-20" },
    b: { box: 1, due: "2026-06-24" },
    c: { box: 3, due: "2026-07-10" },
    d: { box: 2, due: "2026-06-10" }
  };
  const got = S.dueIds(map, ["a", "b", "c", "d", "e"], "2026-06-24");
  assert.deepStrictEqual(got, ["d", "a", "b", "e"]);
});

test("masteredCount compte les paliers 6", () => {
  assert.strictEqual(S.masteredCount({ a: { box: 6, due: "x" }, b: { box: 3, due: "y" }, c: { box: 6, due: "z" } }), 2);
  assert.strictEqual(S.masteredCount({}), 0);
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npm test`
Expected: FAIL — `Cannot find module '../srs-core.js'`.

- [ ] **Step 3: Implémenter `srs-core.js`**

```js
(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.SrsCore = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var BOX_DAYS = [0, 1, 3, 7, 16, 35, 120];

  function clampBox(b) {
    b = b | 0;
    if (b < 1) return 1;
    if (b > 6) return 6;
    return b;
  }

  function intervalForBox(box) {
    return BOX_DAYS[clampBox(box)];
  }

  function addDays(iso, n) {
    var p = String(iso).split("-");
    var d = new Date(Date.UTC(+p[0], (+p[1]) - 1, +p[2]));
    d.setUTCDate(d.getUTCDate() + n);
    var y = d.getUTCFullYear();
    var m = ("0" + (d.getUTCMonth() + 1)).slice(-2);
    var day = ("0" + d.getUTCDate()).slice(-2);
    return y + "-" + m + "-" + day;
  }

  function nextState(prev, knewIt, todayISO) {
    var base = prev ? prev.box : 1;
    var box = knewIt ? clampBox(base + 1) : 1;
    return { box: box, due: addDays(todayISO, intervalForBox(box)) };
  }

  function isDue(state, todayISO) {
    if (!state) return true;
    return state.due <= todayISO;
  }

  function dueIds(srsMap, allIds, todayISO) {
    var seen = [], unseen = [];
    for (var i = 0; i < allIds.length; i++) {
      var id = allIds[i], st = srsMap[id];
      if (!st) { unseen.push(id); continue; }
      if (st.due <= todayISO) seen.push({ id: id, due: st.due });
    }
    seen.sort(function (a, b) { return a.due < b.due ? -1 : (a.due > b.due ? 1 : 0); });
    var out = [];
    for (var j = 0; j < seen.length; j++) out.push(seen[j].id);
    return out.concat(unseen);
  }

  function masteredCount(srsMap) {
    var n = 0;
    for (var k in srsMap) {
      if (Object.prototype.hasOwnProperty.call(srsMap, k) && srsMap[k] && srsMap[k].box === 6) n++;
    }
    return n;
  }

  return {
    BOX_DAYS: BOX_DAYS,
    intervalForBox: intervalForBox,
    addDays: addDays,
    nextState: nextState,
    isDue: isDue,
    dueIds: dueIds,
    masteredCount: masteredCount
  };
});
```

- [ ] **Step 4: Lancer le test pour le voir passer**

Run: `npm test`
Expected: PASS (les 7 tests de `srs-core.test.js` + les tests existants).

- [ ] **Step 5: Commit**

```bash
git add srs-core.js tests/srs-core.test.js
git commit -m "feat: srs-core (paliers Leitner) + tests"
```

---

### Task 2: Runtime SRS dans la page (état, migration, `srsUpdate`, `refreshSrsUI`)

**Files:**
- Modify: `plan-indonesien.html` (balise script + bloc runtime SRS dans le grand IIFE + bouton reset)

**Interfaces:**
- Consumes: `window.SrsCore`, `Store`, `FLAT`, `$`/`$$`.
- Produces (portée du grand IIFE) :
  - `srs` (objet), `srsReady` (Promise), `todayISO() -> string`
  - `srsUpdate(id:string, knewIt:boolean)` — met à jour `srs[id]`, persiste, rafraîchit l'UI
  - `refreshSrsUI()` — met à jour `#srs-due` et `#srs-mastered` s'ils existent

- [ ] **Step 1: Charger `srs-core.js`**

Dans `plan-indonesien.html`, repère les balises `<script src="audio-core.js"></script>` … `<script src="audio-index.js"></script>` (juste avant le `<script>` du grand IIFE). Ajouter après `audio-index.js` :

```html
<script src="srs-core.js"></script>
```

- [ ] **Step 2: Ajouter le bloc runtime SRS**

Repère, dans le grand IIFE, la ligne qui construit `FLAT` :
`var FLAT=[]; VOCAB.forEach(function(t){t.items.forEach(function(it){FLAT.push(Object.assign({theme:t.theme},it));});});`
Juste **après** cette ligne, insérer :

```js
/* ---------- SRS (répétition espacée) ---------- */
var srs = {};
function todayISO(){ return new Date().toISOString().slice(0,10); }
function refreshSrsUI(){
  var ids = FLAT.map(function(x){ return x.id; });
  var due = window.SrsCore.dueIds(srs, ids, todayISO()).length;
  var dt = $("#srs-due"); if(dt) dt.textContent = due;
  var mc = $("#srs-mastered"); if(mc) mc.textContent = window.SrsCore.masteredCount(srs);
}
function srsUpdate(id, knewIt){
  if(!id) return;
  srs[id] = window.SrsCore.nextState(srs[id], !!knewIt, todayISO());
  Store.set("srs", JSON.stringify(srs));
  refreshSrsUI();
}
var srsReady = Store.get("srs").then(function(v){
  if(v){ try{ srs = JSON.parse(v) || {}; }catch(e){ srs = {}; } }
  return Store.get("known").then(function(kv){
    if(!v && kv){
      var known; try{ known = JSON.parse(kv) || {}; }catch(e){ known = {}; }
      var today = todayISO(), changed = false;
      Object.keys(known).forEach(function(id){
        if(known[id]){ srs[id] = { box: 6, due: window.SrsCore.addDays(today, 120) }; changed = true; }
      });
      if(changed) Store.set("srs", JSON.stringify(srs));
    }
    refreshSrsUI();
  });
});
```

- [ ] **Step 3: Le reset global efface aussi `srs`**

Repère le bloc `/* ---------- RESET ---------- */`. Dans le handler, la ligne :
```js
ids.push("known","log");
```
La remplacer par :
```js
ids.push("known","log","srs");
```

- [ ] **Step 4: Vérification (cohérence + console)**

Tu ne peux pas cliquer ; vérifie en relisant ton diff que `srs`, `todayISO`, `refreshSrsUI`, `srsUpdate`, `srsReady` sont définis une fois dans la portée du IIFE, après `FLAT`, et que `window.SrsCore` est chargé avant le IIFE. (La vérif navigateur — migration des `known`, persistance de `srs` — sera faite par le contrôleur.)

- [ ] **Step 5: Commit**

```bash
git add plan-indonesien.html
git commit -m "feat: runtime SRS (etat, migration known->maitrise, srsUpdate)"
```

NOTES : ⚠️ au commit, **uniquement** `git add plan-indonesien.html` (le dépôt contient des centaines de mp3 — jamais `git add -A`/`git add .`). Branche `feat/memorisation-srs` (active).

---

### Task 3: Flashcards → « révision du jour »

**Files:**
- Modify: `plan-indonesien.html` (libellés des boutons flashcards + bouton « réviser en avance » ; IIFE FLASHCARDS réécrit)

**Interfaces:**
- Consumes: `window.SrsCore.dueIds`, `srs`, `srsReady`, `srsUpdate`, `todayISO`, `say`, `VOCAB`, `FLAT`, `$`/`$$`.

- [ ] **Step 1: Adapter les boutons dans le HTML**

Repère le bloc `<div class="flash-ctrl"> … </div>` et la ligne `<button class="reset" id="fc-resetknown">…</button>` juste après. Remplacer :
- le texte du bouton `id="fc-known"` : `✓ Je connais` → `✓ Je savais`
- le texte du bouton `id="fc-review"` : `↻ À revoir` → `↻ Pas encore`
- le texte du bouton `id="fc-next"` : `Suivante →` → `Passer`
- la ligne entière `<button class="reset" id="fc-resetknown">Réinitialiser les « je connais »</button>` par :
  ```html
  <button class="btn ghost" id="fc-ahead" style="display:none">Réviser en avance →</button>
  ```

- [ ] **Step 2: Réécrire l'IIFE FLASHCARDS**

Repère l'IIFE `/* ---------- FLASHCARDS ---------- */ (function(){ … })();`. Remplacer **tout le corps** de cette IIFE par :

```js
(function(){
  var card=$("#flashcard"); if(!card)return;
  var filter=$("#flash-filter");
  var themes=["Tout"].concat(VOCAB.map(function(t){return t.theme;}));
  themes.forEach(function(th,i){
    var b=document.createElement("button"); b.className="chip"+(i===0?" on":""); b.textContent=th; b.setAttribute("data-th",th);
    filter.appendChild(b);
  });

  var deck=[], idx=0, ahead=false, curTheme="Tout";
  function idsForTheme(th){ return (th==="Tout"?FLAT:FLAT.filter(function(x){return x.theme===th;})).map(function(x){return x.id;}); }
  function itemById(id){ for(var i=0;i<FLAT.length;i++){ if(FLAT[i].id===id) return FLAT[i]; } return null; }

  function buildDeck(th){
    curTheme=th; ahead=false; hideAhead();
    var due=window.SrsCore.dueIds(srs, idsForTheme(th), todayISO());
    deck=[]; for(var i=0;i<due.length;i++){ var it=itemById(due[i]); if(it) deck.push(it); }
    idx=0;
    if(!deck.length) showEmpty(); else render();
  }
  function buildAhead(){
    ahead=true; hideAhead();
    var ids=idsForTheme(curTheme), list=[];
    for(var i=0;i<ids.length;i++){
      var st=srs[ids[i]];
      if(!st || st.box<6){ list.push({ id:ids[i], due: st?st.due:"" }); }
    }
    list.sort(function(a,b){ return a.due<b.due?-1:(a.due>b.due?1:0); });
    deck=[]; for(var j=0;j<list.length;j++){ var it=itemById(list[j].id); if(it) deck.push(it); }
    idx=0;
    if(!deck.length){ card.classList.remove("flip"); $("#fc-fr").textContent="🎉 Tout maîtrisé"; $("#fc-id").textContent=""; $("#fc-hint").textContent=""; $("#flash-meta").textContent="Rien de plus à réviser pour ce thème."; card._cur=null; return; }
    render();
  }
  function showEmpty(){
    card.classList.remove("flip");
    $("#fc-fr").textContent="🎉 À jour !";
    $("#fc-id").textContent=""; $("#fc-hint").textContent="";
    $("#flash-meta").textContent="Rien à réviser aujourd'hui dans ce thème.";
    var a=$("#fc-ahead"); if(a) a.style.display="";
    card._cur=null;
  }
  function hideAhead(){ var a=$("#fc-ahead"); if(a) a.style.display="none"; }
  function render(){
    if(!deck.length) return;
    var it=deck[idx%deck.length];
    card.classList.remove("flip");
    $("#fc-fr").textContent=it.fr;
    $("#fc-id").textContent=it.id;
    $("#fc-hint").textContent="";
    var box=(srs[it.id] && srs[it.id].box) || 1;
    $("#flash-meta").textContent="À réviser"+(ahead?" (en avance)":" aujourd'hui")+" : "+deck.length+" · palier "+box;
    card._cur=it;
  }
  function answer(knewIt){
    if(!card._cur) return;
    srsUpdate(card._cur.id, knewIt);
    deck.splice(idx%deck.length,1);
    if(!deck.length){
      if(ahead){ card.classList.remove("flip"); $("#fc-fr").textContent="✅ Fini"; $("#fc-id").textContent=""; $("#flash-meta").textContent="Session terminée."; card._cur=null; }
      else { showEmpty(); }
      return;
    }
    idx=idx%deck.length; render();
  }

  card.addEventListener("click",function(){ if(card._cur) card.classList.toggle("flip"); });
  $("#fc-say").addEventListener("click",function(){ if(card._cur) say(card._cur.id); });
  $("#fc-next").addEventListener("click",function(){ if(deck.length){ idx++; render(); } });
  $("#fc-known").addEventListener("click",function(){ answer(true); });
  $("#fc-review").addEventListener("click",function(){ answer(false); });
  var ab=$("#fc-ahead"); if(ab) ab.addEventListener("click",function(){ buildAhead(); });
  filter.addEventListener("click",function(e){ var b=e.target.closest(".chip"); if(!b)return; $$(".chip",filter).forEach(function(x){x.classList.toggle("on",x===b);}); buildDeck(b.getAttribute("data-th")); });

  srsReady.then(function(){ buildDeck("Tout"); });
})();
```

- [ ] **Step 3: Vérification (cohérence)**

Relis ton diff : l'IIFE n'utilise plus l'ancien `known` local ; il bâtit le paquet via `dueIds(srs, …)` ; `✓ Je savais`/`↻ Pas encore` appellent `answer(true/false)` → `srsUpdate` ; le paquet se reconstruit après `srsReady` ; le bouton `#fc-ahead` déclenche `buildAhead`. (Vérif navigateur faite par le contrôleur/l'utilisateur.)

- [ ] **Step 4: Commit**

```bash
git add plan-indonesien.html
git commit -m "feat: flashcards pilotees par le SRS (revision du jour + reviser en avance)"
```

NOTES : ⚠️ commit **uniquement** `git add plan-indonesien.html` (jamais `-A`/`.`). Ne lance pas le générateur audio ni `npm test` (rien de testable ici).

---

### Task 4: Brancher les quiz sur le SRS

**Files:**
- Modify: `plan-indonesien.html` (handler de réponse du QUIZ VOCAB + du QUIZ D'ÉCOUTE)

**Interfaces:**
- Consumes: `srsUpdate`.

- [ ] **Step 1: Quiz vocabulaire**

Repère l'IIFE `/* ---------- QUIZ VOCAB ---------- */`. Dans le `addEventListener("click", …)` d'une option, après la ligne qui met à jour le score (`$("#qv-score").textContent="Score : "+score+" / "+total;`) et avant la fermeture du handler, ajouter :

```js
        srsUpdate(it.id, op.id===correct);
```

(`it` est l'item courant de la question, `correct` = `it.id`, `op` = l'option cliquée. Vérifie que ces variables existent bien dans la portée du handler — c'est le cas dans l'IIFE QUIZ VOCAB.)

- [ ] **Step 2: Quiz d'écoute**

Repère l'IIFE `/* ---------- QUIZ D'ÉCOUTE ---------- */`. Dans le `addEventListener("click", …)` d'une option, juste après `$("#ql-score").textContent="Score : "+score+" / "+total;`, ajouter :

```js
        srsUpdate(current.id, op.fr===current.fr);
```

(`current` = item joué, `op` = option cliquée. Présents dans la portée du handler.)

- [ ] **Step 3: Vérification (cohérence)**

Relis ton diff : seuls les deux handlers de quiz changent ; chacun appelle `srsUpdate(id, correct?)` avec l'id du mot et un booléen. Le quiz NOMBRES n'est PAS touché. (Vérif navigateur faite par le contrôleur/l'utilisateur.)

- [ ] **Step 4: Commit**

```bash
git add plan-indonesien.html
git commit -m "feat: les quiz vocab et ecoute alimentent le SRS (cahier d'erreurs)"
```

NOTES : ⚠️ commit **uniquement** `git add plan-indonesien.html`.

---

### Task 5: Tuile accueil « à réviser » + stat « maîtrisés » au Carnet

**Files:**
- Modify: `plan-indonesien.html` (HTML `.hero-meta` + clic ; HTML `.stat-row`)

**Interfaces:**
- Consumes: `refreshSrsUI` (déjà appelée au chargement par `srsReady` en Task 2), nav existante.

- [ ] **Step 1: Tuile sur l'accueil**

Repère, dans `#tab-home`, le `<div class="hero-meta">` qui contient la tuile compte à rebours et la jauge. Juste **après** la tuile compte à rebours (`<div class="tile countdown">…</div>`) et avant la tuile jauge, insérer :

```html
      <div class="tile countdown" id="srs-tile" style="cursor:pointer" title="Aller au vocabulaire"><div><div class="k">Révision du jour</div><div class="big" id="srs-due">0</div><div class="sub">cartes à réviser aujourd'hui</div></div></div>
```

- [ ] **Step 2: Clic sur la tuile → onglet Vocabulaire**

Repère le bloc `/* ---------- NAV ---------- */`. Juste **après** ce bloc, ajouter :

```js
/* ---------- TUILE RÉVISION ---------- */
(function(){
  var t=$("#srs-tile"); if(!t) return;
  t.addEventListener("click", function(){ var b=$('#nav button[data-tab="vocab"]'); if(b) b.click(); });
})();
```

- [ ] **Step 3: Stat « maîtrisés » au Carnet**

Repère, dans `#tab-carnet`, le `<div class="stat-row">…</div>`. Juste **avant** sa balise fermante `</div>`, ajouter une 5ᵉ stat :

```html
      <div class="stat"><div class="v" id="srs-mastered">0</div><div class="l">Mots maîtrisés</div></div>
```

- [ ] **Step 4: Vérification (cohérence)**

Relis ton diff : `#srs-due` est dans la tuile accueil, `#srs-mastered` dans `.stat-row` du Carnet ; `refreshSrsUI()` (Task 2) les remplit déjà au chargement et après chaque `srsUpdate`. Le clic sur `#srs-tile` active l'onglet vocab. (Vérif navigateur faite par le contrôleur/l'utilisateur.)

- [ ] **Step 5: Commit**

```bash
git add plan-indonesien.html
git commit -m "feat: tuile 'a reviser' sur l'accueil + compteur 'maitrises' au carnet"
```

NOTES : ⚠️ commit **uniquement** `git add plan-indonesien.html`.

---

## Notes de fin

- **Synchro multi-appareils** de `srs` : repoussée au chantier n°3.
- **Re-drill intra-session** des cartes ratées et **SM-2** : hors périmètre (v2 éventuelle).
- Après ce chantier, vérification navigateur recommandée (voir spec §6).
