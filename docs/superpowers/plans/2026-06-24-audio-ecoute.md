# Audio fiable + Écoute — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la synthèse vocale aléatoire du navigateur par de vrais fichiers audio en voix indonésienne (2 voix), avec repli automatique, puis ajouter de la pratique d'écoute (dialogues à écouter + quiz d'écoute).

**Architecture:** L'app reste un site statique. On extrait les données de langue dans `data.js` et la logique pure (hash, normalisation, choix de voix) dans `audio-core.js`, partagés par la page **et** par un script de génération Node. Le générateur produit `audio/<hash>-<voix>.mp3` via le CLI `edge-tts` et écrit `audio-index.js`. À l'exécution, `say()` joue le fichier s'il existe (sinon repli sur la Web Speech API).

**Tech Stack:** HTML/CSS/JS vanilla (aucune dépendance runtime) ; Node.js + `node:test` (tests de la logique pure) ; `edge-tts` (CLI Python, build uniquement) pour la synthèse.

## Global Constraints

- **Aucune dépendance runtime** : la page ne charge que des fichiers statiques locaux (`audio-core.js`, `data.js`, `audio-index.js`, mp3). Pas de CDN, pas de réseau requis à l'usage.
- **Zéro régression** : tout ce qui n'a pas de fichier audio (ex. nombres tirés au hasard du quiz) retombe sur la Web Speech API, comportement actuel inchangé.
- **Voix** : féminine `id-ID-GadisNeural` (clé `'f'`), masculine `id-ID-ArdiNeural` (clé `'m'`). Défaut : `'f'`.
- **Vitesse de synthèse** : `--rate=-8%` (légèrement ralentie pour l'apprentissage).
- **Hash** : FNV-1a 32 bits → 8 caractères hex, calculé identiquement côté build et côté page via `audio-core.js`.
- **`normalize(s)`** : réduit les espaces internes à une espace simple puis `trim`. Identique build/runtime.
- **Source unique** : les chaînes à voix sont dérivées de `data.js` + des attributs `data-say` du HTML, jamais retapées ailleurs.
- **Stockage préférence voix** : clé `voice` via l'objet `Store` existant (valeurs `'f'`/`'m'`).
- **Style de code** : suivre l'existant — JS ES5 (`var`, fonctions classiques), IIFE, helpers `$`/`$$`.

## Stratégie de test

- **Logique pure → tests automatisés** (`node:test`) : normalisation, hash, nom de fichier, résolution fichier-vs-repli, choix de voix par rôle, collecte des chaînes. C'est là que les bugs sont silencieux et coûteux (un hash qui ne concorde pas = aucun son).
- **DOM / audio → vérification manuelle en navigateur** : étapes concrètes (quoi cliquer, quoi attendre). Monter un harnais navigateur (Playwright/jsdom) serait du sur-dimensionnement pour ce projet perso.

**Lancer la page pour vérifier :** `npx serve .` puis ouvrir l'URL affichée (recommandé), ou double-cliquer le HTML (`file://` fonctionne aussi pour les scripts et l'audio dans la plupart des navigateurs).
**Lancer les tests :** `npm test` (alias de `node --test`).

## Structure de fichiers (cible)

```
learnBahasa/
  plan-indonesien.html   # page — modifiée (charge les 3 scripts, say() refait, voix, écoute)
  audio-core.js          # NEW — logique pure partagée (UMD: window.AudioCore / module.exports)
  data.js                # NEW — données de langue (UMD: window.BAHASA_DATA / module.exports)
  audio-index.js         # NEW (généré) — window.AUDIO_INDEX = [...hashs disponibles...]
  audio/                 # NEW (généré) — <hash>-f.mp3 / <hash>-m.mp3
  tools/
    audio-strings.js     # NEW — collecte des chaînes (Node only, CommonJS)
    generate-audio.js    # NEW — génération mp3 + audio-index.js (Node)
  tests/
    audio-core.test.js   # NEW
    data.test.js         # NEW
    audio-strings.test.js# NEW
  package.json           # NEW — scripts de test
```

---

### Task 1: Logique pure partagée (`audio-core.js`) + harnais de test

**Files:**
- Create: `package.json`
- Create: `audio-core.js`
- Test: `tests/audio-core.test.js`

**Interfaces:**
- Produces (module `AudioCore`, dispo en `window.AudioCore` navigateur et `require("./audio-core.js")` Node) :
  - `normalize(s: string) -> string`
  - `fnv1a(s: string) -> string` (8 hex)
  - `audioFilename(text: string, voice: 'f'|'m') -> string` (`"audio/<hash>-<voice>.mp3"`)
  - `resolveAudio(text: string, voice: 'f'|'m', index: Set<string>|string[]) -> {type:'file', src:string, hash:string} | {type:'tts'}`
  - `voiceForRole(roleIndex: number, voicePref: 'f'|'m') -> 'f'|'m'`

- [ ] **Step 1: Créer `package.json`**

```json
{
  "name": "learn-bahasa",
  "version": "1.0.0",
  "private": true,
  "description": "Plateforme d'apprentissage de l'indonésien",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Écrire le test (qui échoue)**

Create `tests/audio-core.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const AC = require("../audio-core.js");

test("normalize: trim + espaces internes réduits", () => {
  assert.strictEqual(AC.normalize("  apa   kabar  "), "apa kabar");
  assert.strictEqual(AC.normalize("apa"), "apa");
  assert.strictEqual(AC.normalize(""), "");
  assert.strictEqual(AC.normalize(null), "");
});

test("fnv1a: déterministe, 8 hex, insensible aux espaces superflus", () => {
  const h = AC.fnv1a("apa");
  assert.match(h, /^[0-9a-f]{8}$/);
  assert.strictEqual(AC.fnv1a("apa"), h);
  assert.strictEqual(AC.fnv1a("  apa  "), h);
  assert.notStrictEqual(AC.fnv1a("api"), h);
});

test("audioFilename: chemin <hash>-<voix>.mp3", () => {
  const h = AC.fnv1a("apa");
  assert.strictEqual(AC.audioFilename("apa", "f"), "audio/" + h + "-f.mp3");
  assert.strictEqual(AC.audioFilename("apa", "m"), "audio/" + h + "-m.mp3");
});

test("resolveAudio: fichier si présent dans l'index, sinon tts", () => {
  const index = new Set([AC.fnv1a("apa")]);
  const r = AC.resolveAudio("apa", "m", index);
  assert.strictEqual(r.type, "file");
  assert.strictEqual(r.src, "audio/" + AC.fnv1a("apa") + "-m.mp3");
  const r2 = AC.resolveAudio("inconnu", "f", index);
  assert.strictEqual(r2.type, "tts");
});

test("resolveAudio: accepte aussi un tableau de hashs", () => {
  const r = AC.resolveAudio("apa", "f", [AC.fnv1a("apa")]);
  assert.strictEqual(r.type, "file");
});

test("voiceForRole: rôle 0 = préférence, alterne ensuite", () => {
  assert.strictEqual(AC.voiceForRole(0, "f"), "f");
  assert.strictEqual(AC.voiceForRole(1, "f"), "m");
  assert.strictEqual(AC.voiceForRole(2, "f"), "f");
  assert.strictEqual(AC.voiceForRole(0, "m"), "m");
  assert.strictEqual(AC.voiceForRole(1, "m"), "f");
});
```

- [ ] **Step 3: Lancer le test pour le voir échouer**

Run: `npm test`
Expected: FAIL — `Cannot find module '../audio-core.js'`.

- [ ] **Step 4: Implémenter `audio-core.js`**

Create `audio-core.js`:

```js
(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.AudioCore = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function normalize(s) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  }

  function fnv1a(s) {
    var str = normalize(s);
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  }

  function audioFilename(text, voice) {
    return "audio/" + fnv1a(text) + "-" + voice + ".mp3";
  }

  function resolveAudio(text, voice, index) {
    var h = fnv1a(text);
    var has = index && (typeof index.has === "function"
      ? index.has(h)
      : index.indexOf(h) >= 0);
    if (has) return { type: "file", src: "audio/" + h + "-" + voice + ".mp3", hash: h };
    return { type: "tts" };
  }

  function voiceForRole(roleIndex, voicePref) {
    var other = voicePref === "f" ? "m" : "f";
    return (roleIndex % 2 === 0) ? voicePref : other;
  }

  return {
    normalize: normalize,
    fnv1a: fnv1a,
    audioFilename: audioFilename,
    resolveAudio: resolveAudio,
    voiceForRole: voiceForRole
  };
});
```

- [ ] **Step 5: Lancer le test pour le voir passer**

Run: `npm test`
Expected: PASS (tous les tests de `audio-core.test.js`).

- [ ] **Step 6: Commit**

```bash
git add package.json audio-core.js tests/audio-core.test.js
git commit -m "feat: audio-core (normalize, fnv1a, resolveAudio, voiceForRole) + tests"
```

---

### Task 2: Extraire les données de langue dans `data.js`

But : sortir les littéraux de données du HTML vers un module partagé, sans changer le comportement de la page.

**Files:**
- Create: `data.js`
- Modify: `plan-indonesien.html` (bloc `<script>` principal + ajout d'une balise script)
- Test: `tests/data.test.js`

**Interfaces:**
- Produces (module `BAHASA_DATA`, `window.BAHASA_DATA` / `require("./data.js")`) :
  - `vocab: Array<{theme, items: Array<{fr, id}>}>`
  - `phrases: Array<{g, rows: Array<[fr, id]>}>`
  - `dialogues: Array<{t, lines: Array<[role, id, tr]>}>`
  - `drills: Array<{frame, tr, chips: Array<[id, fr]>}>`
  - `food: Array<[id, fr]>`

- [ ] **Step 1: Écrire le test (qui échoue)**

Create `tests/data.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const DATA = require("../data.js");

test("collections présentes", () => {
  for (const k of ["vocab", "phrases", "dialogues", "drills", "food"]) {
    assert.ok(Array.isArray(DATA[k]), k + " doit être un tableau");
  }
});

test("vocab: thèmes avec items {fr,id}", () => {
  assert.ok(DATA.vocab.length >= 12);
  const items = DATA.vocab.flatMap((t) => t.items);
  assert.ok(items.length > 200, "au moins 200 mots");
  assert.ok(items.every((it) => it.fr && it.id));
});

test("dialogues: lignes [role, id, tr]", () => {
  assert.ok(DATA.dialogues.length >= 4);
  assert.ok(DATA.dialogues.every((d) => Array.isArray(d.lines) && d.lines.length > 0));
  assert.ok(DATA.dialogues.every((d) => d.lines.every((l) => l.length === 3)));
});

test("drills: frame contient ___ et a des chips", () => {
  assert.ok(DATA.drills.length >= 5);
  assert.ok(DATA.drills.every((d) => d.frame.includes("___") && d.chips.length > 0));
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npm test`
Expected: FAIL — `Cannot find module '../data.js'`.

- [ ] **Step 3: Créer `data.js` avec l'enveloppe UMD**

Create `data.js` avec ce squelette (le contenu des tableaux est déplacé à l'étape suivante) :

```js
(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.BAHASA_DATA = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var vocab = [ /* DÉPLACER ICI le littéral VOCAB */ ];
  var phrases = [ /* DÉPLACER ICI le littéral groups des phrases de survie */ ];
  var dialogues = [ /* DÉPLACER ICI le littéral scenes des dialogues, en renommant t/lines */ ];
  var drills = [ /* DÉPLACER ICI le littéral drills */ ];
  var food = [ /* DÉPLACER ICI le littéral food (sans la 1re entrée vide ["plat",""]) */ ];

  return { vocab: vocab, phrases: phrases, dialogues: dialogues, drills: drills, food: food };
});
```

- [ ] **Step 4: Déplacer les littéraux depuis `plan-indonesien.html`**

Couper chaque littéral du HTML et le coller dans `data.js` (variable correspondante) :

1. **vocab** — couper le tableau affecté à `var VOCAB=[...]` (repère `/* ================= DONNÉES VOCAB ================= */`, lignes ~839–920). Coller comme valeur de `vocab`. Dans le HTML, remplacer la déclaration par :
   ```js
   var VOCAB = window.BAHASA_DATA.vocab;
   ```
   (Garder la ligne `var FLAT=[]; VOCAB.forEach(...)` juste en dessous, inchangée.)

2. **phrases** — dans l'IIFE `/* ---------- PHRASES DE SURVIE ---------- */`, couper le littéral `var groups=[...]` (lignes ~1002–1007). Coller comme valeur de `phrases`. Dans le HTML, remplacer par :
   ```js
   var groups = window.BAHASA_DATA.phrases;
   ```

3. **dialogues** — dans l'IIFE `/* ---------- DIALOGUES ---------- */`, couper le littéral `var scenes=[...]` (lignes ~1021–1026). Le coller comme valeur de `dialogues` **en conservant la forme `{t:..., lines:[...]}`**. Dans le HTML, remplacer par :
   ```js
   var scenes = window.BAHASA_DATA.dialogues;
   ```

4. **drills** — dans l'IIFE `/* ---------- PATTERN DRILLS ---------- */`, couper le littéral `var drills=[...]` (lignes ~1186–1192). Coller comme valeur de `drills`. Dans le HTML, remplacer par :
   ```js
   var drills = window.BAHASA_DATA.drills;
   ```

5. **food** — dans l'IIFE `/* ---------- FOOD (immersion) ---------- */`, le littéral `var food=[["plat",""],["nasi goreng",...],...]` (lignes ~941–942) est au format `[id, fr]`. Coller dans `data.js` `food` **en retirant la 1re entrée vide `["plat",""]`**. Dans le HTML, remplacer par :
   ```js
   var food = window.BAHASA_DATA.food;
   ```
   La boucle existante `food.forEach(function(f){ if(!f[1]){return;} ... })` reste valable (le garde `if(!f[1])` ne gêne pas).

- [ ] **Step 5: Charger `data.js` AVANT le script principal**

Dans `plan-indonesien.html`, juste avant la balise `<script>` qui ouvre le gros bloc `(function(){ "use strict"; ...`, insérer :

```html
<script src="audio-core.js"></script>
<script src="data.js"></script>
```

(`audio-core.js` est ajouté ici aussi car les tâches suivantes en auront besoin ; il est inoffensif tant qu'il n'est pas appelé.)

- [ ] **Step 6: Lancer les tests**

Run: `npm test`
Expected: PASS (`audio-core.test.js` + `data.test.js`).

- [ ] **Step 7: Vérification manuelle (navigateur)**

Run: `npx serve .` puis ouvrir l'URL.
Vérifier : la page s'affiche normalement, les onglets **Vocabulaire** (listes + flashcards), **Phrases & Dialogues**, **Entraînement** (drills) et **Immersion** (cuisine) affichent bien leur contenu (preuve que `data.js` alimente la page). Aucune erreur en console.

- [ ] **Step 8: Commit**

```bash
git add data.js plan-indonesien.html tests/data.test.js
git commit -m "refactor: extraire les données de langue dans data.js partagé"
```

---

### Task 3: Collecte des chaînes à voix (`tools/audio-strings.js`)

**Files:**
- Create: `tools/audio-strings.js`
- Test: `tests/audio-strings.test.js`

**Interfaces:**
- Consumes: `AudioCore.normalize` (de `audio-core.js`).
- Produces (CommonJS, Node only) : `collectStrings(data, htmlSource?) -> string[]` — liste normalisée et dédupliquée de toutes les chaînes indonésiennes à synthétiser.

- [ ] **Step 1: Écrire le test (qui échoue)**

Create `tests/audio-strings.test.js`:

```js
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { collectStrings } = require("../tools/audio-strings.js");

const data = {
  vocab: [{ theme: "t", items: [{ fr: "un", id: "satu" }, { fr: "eau", id: "air" }] }],
  food: [["nasi goreng", "riz frit"]],
  phrases: [{ g: "x", rows: [["Merci", "Terima kasih"]] }],
  dialogues: [{ t: "d", lines: [["Vous", "Apa kabar?", "ça va ?"], ["X", "Baik", "bien"]] }],
  drills: [{ frame: "Saya mau ___.", tr: "", chips: [["kopi", "café"], ["teh", "thé"]] }]
};
const html = '<button data-say="selamat pagi">x</button><button data-say="Apa kabar?">y</button>';

test("collecte vocab/food/phrases/dialogues + combos de drills + data-say", () => {
  const got = collectStrings(data, html);
  for (const s of ["satu", "air", "nasi goreng", "Terima kasih", "Apa kabar?", "Baik",
                   "Saya mau kopi.", "Saya mau teh.", "selamat pagi"]) {
    assert.ok(got.includes(s), "doit contenir: " + s);
  }
});

test("déduplique (Apa kabar? présent dans dialogue ET html)", () => {
  const got = collectStrings(data, html);
  assert.strictEqual(got.filter((s) => s === "Apa kabar?").length, 1);
});

test("ignore les chaînes vides", () => {
  const got = collectStrings({ vocab: [], food: [["", ""]], phrases: [], dialogues: [], drills: [] }, "");
  assert.ok(!got.includes(""));
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `npm test`
Expected: FAIL — `Cannot find module '../tools/audio-strings.js'`.

- [ ] **Step 3: Implémenter `tools/audio-strings.js`**

```js
"use strict";
const AudioCore = require("../audio-core.js");

function collectStrings(data, htmlSource) {
  const out = [];
  const seen = Object.create(null);
  function add(s) {
    const n = AudioCore.normalize(s);
    if (!n || seen[n]) return;
    seen[n] = true;
    out.push(n);
  }

  (data.vocab || []).forEach((t) => (t.items || []).forEach((it) => add(it.id)));
  (data.food || []).forEach((f) => add(f[0]));
  (data.phrases || []).forEach((g) => (g.rows || []).forEach((r) => add(r[1])));
  (data.dialogues || []).forEach((d) => (d.lines || []).forEach((l) => add(l[1])));
  (data.drills || []).forEach((dr) =>
    (dr.chips || []).forEach((c) => add(dr.frame.replace("___", c[0])))
  );

  if (htmlSource) {
    const re = /data-say="([^"]*)"/g;
    let m;
    while ((m = re.exec(htmlSource))) add(m[1]);
  }
  return out;
}

module.exports = { collectStrings };
```

- [ ] **Step 4: Lancer le test pour le voir passer**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/audio-strings.js tests/audio-strings.test.js
git commit -m "feat: collecte des chaines a synthetiser (tools/audio-strings)"
```

---

### Task 4: Générateur audio (`tools/generate-audio.js`)

But : produire les mp3 (2 voix) et `audio-index.js`. La synthèse est isolée dans `synthesize()` ; le reste (collecte, hash, skip-existant, index) est déterministe.

**Prérequis (à vérifier au démarrage de la tâche) :**
- Python disponible : `python --version` (sinon `py --version`).
- `edge-tts` installé : `python -m pip install edge-tts`, vérifier `python -m edge_tts --help`.

**Files:**
- Create: `tools/generate-audio.js`
- Create: `audio/.gitkeep` (pour suivre le dossier)
- Modify: `.gitignore` (créer si absent — voir Step 6 pour la décision de versionnage)
- Generated: `audio/<hash>-f.mp3`, `audio/<hash>-m.mp3`, `audio-index.js`

**Interfaces:**
- Consumes: `collectStrings` (Task 3), `AudioCore.fnv1a` (Task 1), `data.js` (Task 2).
- Produces: `audio-index.js` → `window.AUDIO_INDEX = ["<hash>", ...]` (UMD : aussi `module.exports`). Un hash n'est listé que si **les deux** fichiers (`-f` et `-m`) existent sur disque.

- [ ] **Step 1: Implémenter `tools/generate-audio.js`**

```js
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const AudioCore = require("../audio-core.js");
const DATA = require("../data.js");
const { collectStrings } = require("./audio-strings.js");

const ROOT = path.resolve(__dirname, "..");
const AUDIO_DIR = path.join(ROOT, "audio");
const HTML = fs.readFileSync(path.join(ROOT, "plan-indonesien.html"), "utf8");

const VOICES = { f: "id-ID-GadisNeural", m: "id-ID-ArdiNeural" };
const RATE = "-8%";

// args: --limit N, --dry-run
const argv = process.argv.slice(2);
const limitIdx = argv.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? parseInt(argv[limitIdx + 1], 10) : Infinity;
const DRY = argv.includes("--dry-run");

function synthesize(text, voiceName, outPath) {
  // Délègue au CLI edge-tts. Args en tableau → pas de souci de quoting.
  execFileSync("python", [
    "-m", "edge_tts",
    "--voice", voiceName,
    "--rate=" + RATE,
    "--text", text,
    "--write-media", outPath
  ], { stdio: "ignore" });
}

function main() {
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  let strings = collectStrings(DATA, HTML);
  if (Number.isFinite(LIMIT)) strings = strings.slice(0, LIMIT);

  console.log(strings.length + " chaînes à traiter (×2 voix). dry-run=" + DRY);

  let made = 0, skipped = 0;
  for (const text of strings) {
    const hash = AudioCore.fnv1a(text);
    for (const v of Object.keys(VOICES)) {
      const out = path.join(AUDIO_DIR, hash + "-" + v + ".mp3");
      if (fs.existsSync(out)) { skipped++; continue; }
      if (DRY) { console.log("WOULD: " + path.basename(out) + "  <= " + text); made++; continue; }
      try {
        synthesize(text, VOICES[v], out);
        made++;
      } catch (e) {
        console.error("ÉCHEC synth: [" + text + "] (" + v + ") — " + e.message);
      }
    }
  }

  // Index = hashs dont LES DEUX voix existent sur disque (reflète le disque, pas juste ce run)
  if (!DRY) writeIndex();
  console.log("Terminé. générés=" + made + " ignorés(déjà là)=" + skipped);
}

function writeIndex() {
  const files = fs.readdirSync(AUDIO_DIR);
  const hasF = new Set(), hasM = new Set();
  for (const f of files) {
    let m;
    if ((m = f.match(/^([0-9a-f]{8})-f\.mp3$/))) hasF.add(m[1]);
    else if ((m = f.match(/^([0-9a-f]{8})-m\.mp3$/))) hasM.add(m[1]);
  }
  const hashes = [...hasF].filter((h) => hasM.has(h)).sort();
  const body =
    "(function (root, factory) {\n" +
    "  var mod = factory();\n" +
    "  if (typeof module !== 'undefined' && module.exports) module.exports = mod;\n" +
    "  else root.AUDIO_INDEX = mod;\n" +
    "})(typeof self !== 'undefined' ? self : this, function () {\n" +
    "  return " + JSON.stringify(hashes) + ";\n" +
    "});\n";
  fs.writeFileSync(path.join(ROOT, "audio-index.js"), body, "utf8");
  console.log("audio-index.js écrit : " + hashes.length + " entrées.");
}

main();
```

- [ ] **Step 2: Test à blanc (aucune synthèse, vérifie collecte + hash)**

Run: `node tools/generate-audio.js --dry-run --limit 5`
Expected: affiche `5 chaînes à traiter`, puis 10 lignes `WOULD: <hash>-f.mp3 <= ...` / `<hash>-m.mp3`. Aucun fichier créé.

- [ ] **Step 3: Génération d'un petit échantillon réel**

Run: `node tools/generate-audio.js --limit 5`
Expected: crée 10 fichiers dans `audio/` et écrit `audio-index.js` avec 5 entrées. Vérifier :
```bash
ls audio | wc -l        # >= 10
node -e "console.log(require('./audio-index.js').length)"   # 5
```
Ouvrir un `.mp3` dans un lecteur : on entend bien une voix indonésienne.

- [ ] **Step 4: Génération complète**

Run: `node tools/generate-audio.js`
Expected: traite ~400 chaînes ×2 voix (peut prendre quelques minutes ; relançable, il saute l'existant). `audio-index.js` liste ~400 entrées.

- [ ] **Step 5: Créer `audio/.gitkeep`**

Create `audio/.gitkeep` (fichier vide).

- [ ] **Step 6: Décider du versionnage des mp3 + `.gitignore`**

Les mp3 sont des artefacts générés mais nécessaires au déploiement (chantier n°3). Décision : **on les versionne** (quelques Mo, et le site doit fonctionner une fois cloné/déployé sans relancer la génération).
Create `.gitignore`:
```
node_modules/
```

- [ ] **Step 7: Commit**

```bash
git add tools/generate-audio.js audio-index.js audio .gitignore
git commit -m "feat: generateur audio edge-tts + audio-index + mp3 generes"
```

---

### Task 5: Refonte de `say()` (fichier d'abord, repli TTS)

**Files:**
- Modify: `plan-indonesien.html` (bloc `<script>` principal : ajout chargement `audio-index.js`, section AUDIO)

**Interfaces:**
- Consumes: `window.AudioCore.resolveAudio`, `window.AUDIO_INDEX`, `Store` existant.
- Produces (dans la portée du script principal) :
  - `voicePref` (`'f'`/`'m'`, var de module)
  - `AUDIO_INDEX_SET: Set<string>`
  - `say(text, opts?: {voice?: 'f'|'m'})` (rétro-compatible : `say("texte")` marche toujours)
  - `ttsSpeak(text)` (repli Web Speech, ex-corps de `say`)

- [ ] **Step 1: Charger `audio-index.js`**

Dans `plan-indonesien.html`, à côté des balises ajoutées en Task 2, ajouter après `data.js` :

```html
<script src="audio-index.js"></script>
```

(S'il n'existe pas encore, le 404 est sans effet : `AUDIO_INDEX` reste indéfini → index vide → tout en repli.)

- [ ] **Step 2: Remplacer le bloc AUDIO**

Repère `/* ---------- AUDIO (Web Speech API id-ID) ---------- */`. Remplacer **uniquement** la fonction `say` et garder `loadVoice`/`idVoice`/le listener de clic (le listener sera modifié en Task 7). Remplacer :

```js
function say(t){ if(!("speechSynthesis" in window)||!t)return; try{ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(t); u.lang="id-ID"; if(idVoice)u.voice=idVoice; u.rate=.88; speechSynthesis.speak(u); }catch(e){} }
```

par :

```js
var AUDIO_INDEX_SET = new Set(window.AUDIO_INDEX || []);
var voicePref = "f";
var _audioEl = null;
function ttsSpeak(t){
  if(!("speechSynthesis" in window)||!t) return;
  try{ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(t); u.lang="id-ID"; if(idVoice)u.voice=idVoice; u.rate=.88; speechSynthesis.speak(u); }catch(e){}
}
function say(t, opts){
  if(!t) return;
  var v = (opts && opts.voice) || voicePref;
  var res = window.AudioCore.resolveAudio(t, v, AUDIO_INDEX_SET);
  if(res.type === "file"){
    try{
      try{ speechSynthesis.cancel(); }catch(e){}
      if(!_audioEl) _audioEl = new Audio();
      _audioEl.pause();
      _audioEl.src = res.src;
      _audioEl.currentTime = 0;
      var p = _audioEl.play();
      if(p && p.catch){ p.catch(function(){ ttsSpeak(t); }); }
      return;
    }catch(e){ /* repli */ }
  }
  ttsSpeak(t);
}
```

- [ ] **Step 3: Charger la préférence de voix au démarrage**

Repère la fin du script `/* ---------- INIT ---------- */` (`loadChecks();`). Juste au-dessus de `loadChecks();`, ajouter :

```js
Store.get("voice").then(function(v){ if(v === "m" || v === "f") voicePref = v; });
```

- [ ] **Step 4: Vérification manuelle (navigateur)**

Run: `npx serve .` puis ouvrir l'URL. (Nécessite la génération complète de Task 4.)
Vérifier :
- Onglet **Vocabulaire** → cliquer 🔊 sur un mot (ex. « selamat pagi ») : on entend le **fichier mp3** (voix neuronale claire), pas la voix système.
- Onglet **Entraînement → Quiz · les nombres** : répondre ; le nombre tiré au hasard est lu en **repli TTS** (la voix système). Pas d'erreur console.

- [ ] **Step 5: Commit**

```bash
git add plan-indonesien.html
git commit -m "feat: say() joue les fichiers audio avec repli TTS + voicePref"
```

---

### Task 6: Sélecteur de voix ♀ / ♂ dans la barre du haut

**Files:**
- Modify: `plan-indonesien.html` (HTML topbar, CSS, JS)

**Interfaces:**
- Consumes: `voicePref`, `Store`, `say` (Task 5).
- Produces: `updateVoiceToggle()` ; bouton `#voice-toggle`.

- [ ] **Step 1: Ajouter le bouton dans la barre**

Repère `<span class="brand">Bahasa<span class="dot">.</span></span>`. Juste après la balise fermante `</nav>` (dans `.topbar-inner`), ajouter :

```html
<button id="voice-toggle" class="voice-toggle" title="Voix de lecture (femme / homme)" aria-label="Changer de voix">♀</button>
```

- [ ] **Step 2: CSS du bouton**

Repère le bloc `.nav button:focus-visible{...}` dans `<style>`. Juste après, ajouter :

```css
.voice-toggle{margin-left:auto;flex:0 0 auto;font-size:16px;line-height:1;width:34px;height:34px;border-radius:9px;border:1px solid var(--line-strong);background:#fff;color:var(--ocean);cursor:pointer;transition:.15s}
.voice-toggle:hover{background:var(--ocean);color:#fff;border-color:var(--ocean)}
.voice-toggle:focus-visible{outline:2px solid var(--turmeric);outline-offset:2px}
```

- [ ] **Step 3: JS du sélecteur**

Repère le bloc `/* ---------- NAV ---------- */`. Juste après ce bloc (après la fermeture du `forEach` de la nav), ajouter :

```js
/* ---------- SÉLECTEUR DE VOIX ---------- */
function updateVoiceToggle(){ var b=$("#voice-toggle"); if(b) b.textContent = (voicePref === "f" ? "♀" : "♂"); }
(function(){
  var b=$("#voice-toggle"); if(!b) return;
  b.addEventListener("click", function(){
    voicePref = (voicePref === "f" ? "m" : "f");
    Store.set("voice", voicePref);
    updateVoiceToggle();
    say("terima kasih");
  });
})();
```

- [ ] **Step 4: Refléter la voix stockée à l'init**

Modifier la ligne ajoutée en Task 5 Step 3 pour rafraîchir le bouton une fois la préférence chargée :

```js
Store.get("voice").then(function(v){ if(v === "m" || v === "f") voicePref = v; updateVoiceToggle(); });
```

- [ ] **Step 5: Vérification manuelle (navigateur)**

Vérifier :
- Le bouton affiche ♀ au départ. Clic → passe à ♂ et lit « terima kasih » avec la **voix masculine**.
- Recliquer un 🔊 de vocabulaire : voix masculine.
- Recharger la page : le bouton est toujours sur ♂ (préférence persistée).

- [ ] **Step 6: Commit**

```bash
git add plan-indonesien.html
git commit -m "feat: selecteur de voix homme/femme dans la barre"
```

---

### Task 7: Voix par rôle dans les dialogues

**Files:**
- Modify: `plan-indonesien.html` (listener de clic global + IIFE DIALOGUES)

**Interfaces:**
- Consumes: `window.AudioCore.voiceForRole`, `voicePref`, `say`.
- Produces: les boutons 🔊 des dialogues portent `data-role="<index>"` ; le listener global calcule la voix au clic.

- [ ] **Step 1: Étendre le listener de clic global**

Repère, dans le bloc AUDIO, le listener :

```js
document.addEventListener("click",function(e){ var el=e.target.closest("[data-say]"); if(el){ e.preventDefault(); say(el.getAttribute("data-say")); } });
```

Remplacer par :

```js
document.addEventListener("click",function(e){
  var el=e.target.closest("[data-say]"); if(!el) return;
  e.preventDefault();
  var v;
  if(el.hasAttribute("data-role")){
    v = window.AudioCore.voiceForRole(parseInt(el.getAttribute("data-role"),10)||0, voicePref);
  } else if(el.getAttribute("data-voice")){
    v = el.getAttribute("data-voice");
  }
  say(el.getAttribute("data-say"), { voice: v });
});
```

- [ ] **Step 2: Affecter un index de rôle stable par dialogue**

Dans l'IIFE `/* ---------- DIALOGUES ---------- */`, repère la boucle `scenes.forEach(function(s){ ... s.lines.forEach(function(l){ ... }); ... });`. Remplacer le corps par une version qui calcule l'ordre des rôles et pose `data-role` :

```js
scenes.forEach(function(s){
  var c=document.createElement("div"); c.className="gcard";
  var roleOrder=[];
  s.lines.forEach(function(l){ if(roleOrder.indexOf(l[0])<0) roleOrder.push(l[0]); });
  var html='<h3>'+s.t+'</h3>';
  s.lines.forEach(function(l){
    var ri=roleOrder.indexOf(l[0]);
    html+='<p style="margin:8px 0"><b style="font-family:Space Mono;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6C786F">'+l[0]+'</b><br><span class="id-word" style="color:#16564C;font-weight:600">'+l[1]+'</span> <button class="say" data-say="'+l[1].replace(/"/g,"")+'" data-role="'+ri+'">🔊</button><br><em style="color:#6C786F;font-size:13.5px">'+l[2]+'</em></p>';
  });
  c.innerHTML=html; m.appendChild(c);
});
```

- [ ] **Step 3: Vérification manuelle (navigateur)**

Onglet **Phrases & Dialogues → Dialogues**. Dans « Prendre un taxi », cliquer les 🔊 :
- Les lignes « Vous » sont lues avec la voix de la préférence (♀ par défaut).
- Les lignes « Chauffeur » sont lues avec **l'autre** voix (♂).
- Basculer le sélecteur de voix puis recliquer : les rôles s'inversent (Vous → ♂, Chauffeur → ♀).

- [ ] **Step 4: Commit**

```bash
git add plan-indonesien.html
git commit -m "feat: voix distincte par interlocuteur dans les dialogues"
```

---

### Task 8: Mode « écoute d'abord » des dialogues (lecture enchaînée + masquer le texte)

**Files:**
- Modify: `plan-indonesien.html` (CSS, IIFE DIALOGUES)

**Interfaces:**
- Consumes: `window.AudioCore.resolveAudio`, `window.AudioCore.voiceForRole`, `voicePref`, `idVoice`, `AUDIO_INDEX_SET`.
- Produces: par carte de dialogue, un bouton ▶️ (lecture séquentielle) et un bouton 👁️ (masquer/afficher le texte indonésien) ; chaque ligne enveloppée dans `.dlg-line` avec `.dlg-id`.

- [ ] **Step 1: CSS du mode écoute**

Repère dans `<style>` la fin du bloc des dialogues/gcard (après `.gcard p{...}`). Ajouter :

```css
.dlg-line{margin:8px 0}
.dlg-line.dlg-active{background:rgba(221,154,26,.14);border-radius:8px;padding:4px 8px;margin-left:-8px;margin-right:-8px}
.dlg-hidden .dlg-id{visibility:hidden}
.dlg-ctrl{display:flex;gap:8px;margin:4px 0 10px}
.dlg-ctrl .btn{padding:7px 12px;font-size:12px}
```

- [ ] **Step 2: Réécrire l'IIFE DIALOGUES avec lignes enveloppées + contrôles**

Remplacer l'intégralité du corps de `scenes.forEach(...)` (issu de Task 7) par :

```js
scenes.forEach(function(s){
  var c=document.createElement("div"); c.className="gcard";
  var roleOrder=[];
  s.lines.forEach(function(l){ if(roleOrder.indexOf(l[0])<0) roleOrder.push(l[0]); });

  var html='<h3>'+s.t+'</h3>';
  html+='<div class="dlg-ctrl"><button class="btn dlg-play">▶️ Écouter le dialogue</button><button class="btn ghost dlg-hide">👁️ Masquer le texte</button></div>';
  s.lines.forEach(function(l){
    var ri=roleOrder.indexOf(l[0]);
    html+='<p class="dlg-line"><b style="font-family:Space Mono;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6C786F">'+l[0]+'</b><br><span class="id-word dlg-id" style="color:#16564C;font-weight:600">'+l[1]+'</span> <button class="say" data-say="'+l[1].replace(/"/g,"")+'" data-role="'+ri+'">🔊</button><br><em style="color:#6C786F;font-size:13.5px">'+l[2]+'</em></p>';
  });
  c.innerHTML=html;

  c.querySelector(".dlg-hide").addEventListener("click", function(){
    c.classList.toggle("dlg-hidden");
    this.textContent = c.classList.contains("dlg-hidden") ? "👁️ Afficher le texte" : "👁️ Masquer le texte";
  });
  c.querySelector(".dlg-play").addEventListener("click", function(){
    playDialogue(c, s.lines, roleOrder);
  });

  m.appendChild(c);
});

function playDialogue(card, lines, roleOrder){
  var rows = Array.prototype.slice.call(card.querySelectorAll(".dlg-line"));
  var i = 0;
  function clearHl(){ rows.forEach(function(r){ r.classList.remove("dlg-active"); }); }
  function step(){
    clearHl();
    if(i >= lines.length) return;
    rows[i].classList.add("dlg-active");
    var l = lines[i];
    var v = window.AudioCore.voiceForRole(roleOrder.indexOf(l[0]), voicePref);
    var res = window.AudioCore.resolveAudio(l[1], v, AUDIO_INDEX_SET);
    i++;
    if(res.type === "file"){
      var a = new Audio(res.src);
      a.onended = step;
      a.onerror = function(){ ttsThenStep(l[1]); };
      var p = a.play(); if(p && p.catch) p.catch(function(){ ttsThenStep(l[1]); });
    } else {
      ttsThenStep(l[1]);
    }
  }
  function ttsThenStep(t){
    if(!("speechSynthesis" in window)){ setTimeout(step, 900); return; }
    try{
      speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance(t); u.lang="id-ID"; if(idVoice)u.voice=idVoice; u.rate=.88;
      u.onend = step; speechSynthesis.speak(u);
    }catch(e){ setTimeout(step, 900); }
  }
  step();
}
```

- [ ] **Step 3: Vérification manuelle (navigateur)**

Onglet **Phrases & Dialogues → Dialogues** :
- Cliquer **▶️ Écouter le dialogue** : les lignes s'enchaînent automatiquement, chacune surlignée à son tour, avec **deux voix** alternées. Le surlignage disparaît à la fin.
- Cliquer **👁️ Masquer le texte** : le texte indonésien disparaît (le rôle et la traduction restent) ; le libellé devient « Afficher le texte ». On peut alors ▶️ écouter sans lire, puis réafficher.

- [ ] **Step 4: Commit**

```bash
git add plan-indonesien.html
git commit -m "feat: mode ecoute des dialogues (lecture enchainee + masquer le texte)"
```

---

### Task 9: Quiz d'écoute (onglet Entraînement)

**Files:**
- Modify: `plan-indonesien.html` (HTML onglet Entraînement + nouvel IIFE)

**Interfaces:**
- Consumes: `FLAT` (vocab à plat, existant), `window.AudioCore.fnv1a`, `AUDIO_INDEX_SET`, `say`, `$`, `$$`.
- Produces: bloc `#quiz-listen` interactif.

- [ ] **Step 1: Ajouter le bloc HTML**

Dans `<section class="panel" id="tab-training">`, repère le 3ᵉ bloc `/* pattern drills */` :
`<div class="block-head"><span class="num">03</span><h2>Pattern drills · production</h2></div>` … `<div id="drill-mount"></div>` puis `</section>`.
Juste avant la balise `</section>` qui ferme `#tab-training`, insérer :

```html
  <section class="block">
    <div class="block-head"><span class="num">04</span><h2>Quiz d'écoute</h2></div>
    <p class="intro">On te joue un mot ou une phrase : choisis le bon sens. Clique 🔊 pour réécouter. (Nécessite l'audio généré.)</p>
    <div class="quiz" id="quiz-listen">
      <div class="q"><button class="btn" id="ql-play">🔊 Écouter</button></div>
      <div class="opts" id="ql-opts"></div>
      <div class="quiz-foot"><span id="ql-score">Score : 0 / 0</span><button class="btn ghost" id="ql-next">Nouveau →</button></div>
    </div>
  </section>
```

- [ ] **Step 2: Ajouter l'IIFE du quiz d'écoute**

Repère l'IIFE `/* ---------- QUIZ VOCAB ---------- */ ... })();`. Juste après sa fermeture, ajouter :

```js
/* ---------- QUIZ D'ÉCOUTE ---------- */
(function(){
  var box=$("#quiz-listen"); if(!box) return;
  var pool = FLAT.filter(function(x){ return AUDIO_INDEX_SET.has(window.AudioCore.fnv1a(x.id)); });
  if(!pool.length){ box.innerHTML='<p style="color:#6C786F;font-size:14px">Audio pas encore généré — lance la génération pour activer ce quiz.</p>'; return; }
  var score=0,total=0,answered=false,current=null;
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}}
  function gen(){
    answered=false;
    var p=pool.slice(); shuffle(p);
    current=p[0];
    var opts=[current], k=1;
    while(opts.length<4 && k<p.length){ if(!opts.some(function(x){return x.fr===p[k].fr;})) opts.push(p[k]); k++; }
    shuffle(opts);
    var o=$("#ql-opts"); o.innerHTML="";
    opts.forEach(function(op){
      var b=document.createElement("button"); b.className="opt"; b.textContent=op.fr;
      b.addEventListener("click",function(){
        if(answered)return; answered=true; total++;
        if(op.fr===current.fr){ b.classList.add("good"); score++; }
        else { b.classList.add("bad"); $$("#ql-opts .opt").forEach(function(x){ if(x.textContent===current.fr) x.classList.add("good"); }); }
        $("#ql-score").textContent="Score : "+score+" / "+total;
        say(current.id);
      });
      o.appendChild(b);
    });
    say(current.id);
  }
  $("#ql-play").addEventListener("click",function(){ if(current) say(current.id); });
  $("#ql-next").addEventListener("click",gen);
  gen();
})();
```

- [ ] **Step 3: Vérification manuelle (navigateur)**

Onglet **Entraînement → Quiz d'écoute** :
- Au chargement, un audio se joue automatiquement (un mot indonésien). 4 propositions **en français** s'affichent.
- Cliquer la bonne réponse : elle passe au vert, le score s'incrémente, l'audio rejoue.
- Cliquer une mauvaise : elle passe au rouge, la bonne se surligne en vert.
- **🔊 Écouter** rejoue ; **Nouveau →** tire une autre question.

- [ ] **Step 4: Commit**

```bash
git add plan-indonesien.html
git commit -m "feat: quiz d'ecoute (audio -> sens) dans l'onglet Entrainement"
```

---

## Notes de fin

- **Renommage `plan-indonesien.html` → `index.html`** : repoussé au chantier n°3 (hébergement), pour ne pas casser les chemins pendant ce chantier.
- **Dictée** : v2 de l'écoute, hors périmètre.
- **Régénérer l'audio** après tout ajout de vocabulaire/dialogue : `node tools/generate-audio.js` (saute l'existant, ne génère que le nouveau).
