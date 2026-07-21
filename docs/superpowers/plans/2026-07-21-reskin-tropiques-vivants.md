# Reskin « Tropiques vivants » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'identité visuelle « défaut IA » (crème / serif Fraunces / Space Mono / ombres douces) par le design-system « Tropiques vivants » (fintech-pop tropical maîtrisé + signature botanique), via l'échange des tokens CSS et le swap de polices, en repeignant tout le site.

**Architecture:** Le CSS vit dans un unique `<style>` ([index.html:16-296](../../../index.html#L16-L296)) qui utilise déjà des variables `:root`. On change les **valeurs** des variables (mêmes noms → repeint global), on swappe le lien Google Fonts, et on remplace les noms de polices littéraux. Aucune logique JS n'est touchée.

**Tech Stack:** HTML/CSS vanilla dans `index.html`, Google Fonts (mises en cache au runtime par le service worker), PWA `sw.js`.

## Global Constraints

- **Palette (valeurs finales, noms de variables conservés)** : `--paper:#F4FBF7` · `--card:#FFFFFF` · `--card2:#FFFFFF` · `--ink:#0C2A24` · `--ocean:#0FB88F` (jade primaire) · `--jade:#0A7C63` (palm/profondeur) · `--turmeric:#FFC53D` (soleil) · `--merah:#FF4D79` (hibiscus) · `--muted:#5C726B` · `--line:rgba(12,42,36,.12)` · `--line-strong:rgba(12,42,36,.20)` · `--shadow:none` · `--r:14px`. Nouveaux : `--r-sm:8px` · `--r-pill:999px` · `--sun:#FFC53D` · `--hibiscus:#FF4D79`.
- **Polices** : display + chiffres = **Bricolage Grotesque** ; texte = **Hanken Grotesk**. **Zéro Fraunces, zéro Space Mono** ne doit subsister (sauf `code`/`.mono` → pile monospace système, sans police web).
- **Flat pop** : aucune ombre douce ; séparation par bordures nettes + aplats.
- **Thème clair uniquement.**
- **Gros chiffres ciblés** (streak, XP, J-, %) via `.stat-xxl`, pas partout.
- **`prefers-reduced-motion`** respecté sur toute animation.
- **SW** : bump `bahasa-v6`.
- **Aucune régression fonctionnelle** : `npm test` (42) reste vert ; le `<script>` inline parse toujours ; les états `.on/.good/.bad` restent lisibles.
- Vérification **visuelle = navigateur (manuel, par l'humain)** : ces tâches n'ont pas de test DOM automatisé. Chaque tâche vérifie néanmoins : `npm test` vert, parse du script inline, et assertions `grep` ciblées.

---

## File Structure

- **Modify** `index.html` — bloc `<style>` (tokens, polices, composants, signature, héros) + 2 styles inline JS ([index.html:1242](../../../index.html#L1242), [index.html:1374](../../../index.html#L1374)).
- **Modify** `sw.js` — bump du cache.

---

## Task 1 : Fondations — tokens + polices de base

**Files:**
- Modify: `index.html` — lien fonts ([:15](../../../index.html#L15)), `:root` ([:17-20](../../../index.html#L17-L20)), `body` ([:24](../../../index.html#L24)), `h1-h4` ([:28](../../../index.html#L28)), `.brand` ([:34](../../../index.html#L34))

**Interfaces:**
- Produces : les variables CSS repalettées + les polices de base ; toutes les tâches suivantes s'appuient sur ces tokens.

- [ ] **Step 1 : Remplacer le lien Google Fonts**

Remplacer la ligne [index.html:15](../../../index.html#L15) par :
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 2 : Remplacer le bloc `:root`**

Remplacer les lignes [index.html:18-20](../../../index.html#L18-L20) (les 3 lignes de déclarations, en gardant `:root{` ligne 17 et le `}` fermant) par :
```css
    --paper:#F4FBF7;--card:#FFFFFF;--card2:#FFFFFF;--ink:#0C2A24;--ocean:#0FB88F;--jade:#0A7C63;
    --turmeric:#FFC53D;--merah:#FF4D79;--muted:#5C726B;--line:rgba(12,42,36,.12);
    --line-strong:rgba(12,42,36,.20);--shadow:none;--r:14px;--r-sm:8px;--r-pill:999px;--sun:#FFC53D;--hibiscus:#FF4D79;
```

- [ ] **Step 3 : Polices de base**

- `body` ([:24](../../../index.html#L24)) : remplacer `font-family:"Inter",system-ui,sans-serif` par `font-family:"Hanken Grotesk",system-ui,sans-serif`.
- `h1,h2,h3,h4` ([:28](../../../index.html#L28)) : remplacer `font-family:"Fraunces",serif;font-weight:600;line-height:1.05;letter-spacing:-.01em;margin:0` par `font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;line-height:1.03;letter-spacing:-.02em;margin:0`.
- `.brand` ([:34](../../../index.html#L34)) : remplacer `font-family:"Fraunces",serif;font-weight:700` par `font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800`.

- [ ] **Step 4 : Vérifier**

Run: `npm test`
Expected: `pass 42`, `fail 0`.
Puis vérifier que le `<script>` inline parse (extraire les blocs `<script>` et `new Function(src)` sans throw).

- [ ] **Step 5 : Commit**
```bash
git add index.html
git commit -m "feat(reskin): tokens Tropiques vivants + polices de base (Bricolage/Hanken)"
```

---

## Task 2 : Éradiquer les polices « défaut » (Fraunces / Space Mono)

**Files:**
- Modify: `index.html` — toutes les occurrences restantes dans `<style>` + les 2 styles inline JS ([:1242](../../../index.html#L1242), [:1374](../../../index.html#L1374))

**Interfaces:**
- Consumes : polices de base de Task 1.
- Produces : plus aucune référence Fraunces/Space Mono (hors `code`/`.mono`).

- [ ] **Step 1 : Recenser**

Run: `grep -n "Fraunces\|Space Mono" index.html | wc -l` puis `grep -n "Fraunces\|Space Mono" index.html`
Noter chaque occurrence (formes **avec** guillemets `"Fraunces"` et **sans** `font-family:Fraunces`, en CSS et en JS inline).

- [ ] **Step 2 : Remplacer Fraunces → Bricolage Grotesque**

Remplacer **toutes** les occurrences de la famille `Fraunces` par `Bricolage Grotesque`, en conservant la présence/absence de guillemets du contexte :
- `"Fraunces",serif` → `"Bricolage Grotesque",system-ui,sans-serif`
- `"Fraunces"` (seul) → `"Bricolage Grotesque"`
- `font-family:Fraunces` (sans guillemets, styles inline JS l.1242) → `font-family:Bricolage Grotesque`
- Les usages en italique (`.salam`, `.phase h3 .id`, `.gcard h3 .sub`, `.prompt-box .pt`, `footer .ttd`) : garder `font-style:italic`, juste changer la famille.

- [ ] **Step 3 : Remplacer Space Mono → Hanken Grotesk (labels)**

Remplacer **toutes** les occurrences de la famille `Space Mono` par `Hanken Grotesk` (les `text-transform:uppercase` / `letter-spacing` déjà présents donnent l'aspect « label ») :
- `"Space Mono",monospace` → `"Hanken Grotesk",system-ui,sans-serif`
- `"Space Mono"` (seul) → `"Hanken Grotesk"`
- `font-family:Space Mono` (styles inline JS l.1374) → `font-family:Hanken Grotesk`

- [ ] **Step 4 : Exceptions monospace techniques**

- `.mono` ([:27](../../../index.html#L27)) : remplacer la famille par `font-family:ui-monospace,SFMono-Regular,Menlo,monospace`.
- `code` ([:136](../../../index.html#L136)) : idem, `font-family:ui-monospace,SFMono-Regular,Menlo,monospace`.

- [ ] **Step 5 : Vérifier l'éradication**

Run: `grep -n "Fraunces\|Space Mono" index.html`
Expected: **aucune sortie** (0 occurrence).
Run: `npm test` → `pass 42`. Vérifier le parse du script inline.

- [ ] **Step 6 : Commit**
```bash
git add index.html
git commit -m "feat(reskin): swap total des polices (fini Fraunces/Space Mono)"
```

---

## Task 3 : Flat pop — ombres résiduelles & séparation par bordures

**Files:**
- Modify: `index.html` — `.dot` ([:111](../../../index.html#L111)), `.lesson.next` ([:121](../../../index.html#L121)), `.ch-toast` ([:288](../../../index.html#L288)), et vérif des surfaces ex-`var(--shadow)`

**Interfaces:**
- Consumes : `--shadow:none`, tokens de Task 1.

- [ ] **Step 1 : Neutraliser les ombres codées en dur**

- `.dot` ([:111](../../../index.html#L111)) : remplacer `box-shadow:0 0 0 5px rgba(221,154,26,.16)` par `box-shadow:0 0 0 4px rgba(255,197,61,.20)` (halo retinté soleil — accent net assumé, pas une ombre de profondeur ; garder).
- `.lesson.next` ([:121](../../../index.html#L121)) : remplacer `box-shadow:0 0 0 2px rgba(46,139,121,.2)` par `box-shadow:0 0 0 2px rgba(15,184,143,.35)` (anneau jade net).
- `.ch-toast` ([:288](../../../index.html#L288)) : `box-shadow:var(--shadow)` vaut désormais `none` ; ajouter `border:1px solid rgba(255,255,255,.12)` pour un léger détachement du toast sombre. (Le `#ch-toast` sera remplacé au chantier « Ta journée » ; retouche minimale ici.)

- [ ] **Step 2 : Confirmer la séparation des surfaces ex-ombre**

Vérifier que ces surfaces qui utilisaient `var(--shadow)` ont bien une bordure nette (sinon ajouter `border:1px solid var(--line)`), désormais que l'ombre est `none` :
`.submenu` ([:44](../../../index.html#L44)) ✓ a déjà `border` · `.nav` mobile ([:55](../../../index.html#L55)) ✓ `border-bottom` · `.tile` ([:75](../../../index.html#L75)) ✓ `border` · `.fc-face` ([:202](../../../index.html#L202)) ✓ `border`. Ajouter une bordure seulement si l'une n'en a pas.

- [ ] **Step 3 : Étiquettes — resserrer le tracking**

Réduire le sur-espacement « mono » sur les labels les plus visibles : `.eyebrow` ([:30](../../../index.html#L30)) `letter-spacing:.18em` → `.08em` ; `.tile .k` ([:76](../../../index.html#L76)) `.14em` → `.08em`. (Les autres labels peuvent rester ; ne pas sur-modifier.)

- [ ] **Step 4 : Vérifier**

Run: `grep -n "box-shadow" index.html` → confirmer qu'il ne reste que les 3 halos/bordures voulus (`.dot`, `.lesson.next`, `.ch-toast`) — plus aucune ombre douce de profondeur.
Run: `npm test` → `pass 42`. Parse du script inline OK.

- [ ] **Step 5 : Commit**
```bash
git add index.html
git commit -m "feat(reskin): flat pop (ombres neutralisees, bordures nettes, labels resserres)"
```

---

## Task 4 : Héros accueil + chiffres XXL

**Files:**
- Modify: `index.html` — utilitaire `.stat-xxl` (dans `<style>`), `.hero .salam` ([:70](../../../index.html#L70)), `.countdown .big` ([:77](../../../index.html#L77)), `.stat .v` ([:238](../../../index.html#L238)), `.ring-num` ([:83](../../../index.html#L83)) ; section `#tab-home` ([:292+](../../../index.html#L292))

**Interfaces:**
- Consumes : tokens + polices (T1/T2).

- [ ] **Step 1 : Ajouter l'utilitaire `.stat-xxl`**

Ajouter dans le `<style>` (près des utilitaires typographiques, après `h1-h4`) :
```css
  .stat-xxl{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:clamp(40px,7vw,84px);line-height:.92;letter-spacing:-.03em}
```

- [ ] **Step 2 : Chiffres cibles en Bricolage/XXL**

- `.countdown .big` ([:77](../../../index.html#L77)) : famille déjà Bricolage (T2) ; monter `font-size:40px` → `clamp(44px,6vw,72px)`, `font-weight:800`, `letter-spacing:-.03em`, couleur `--merah` (hibiscus) conservée.
- `.stat .v` ([:238](../../../index.html#L238)) : `font-size:32px` → `clamp(30px,4vw,44px)`, `font-weight:800`, couleur `--ocean` (jade).
- `.ring-num` ([:83](../../../index.html#L83)) : `font-weight:800`, `letter-spacing:-.02em` (taille inchangée).

- [ ] **Step 3 : Héros — retirer l'italique serif, affirmer le manifeste**

- `.hero .salam` ([:70](../../../index.html#L70)) : remplacer `font-family:"Bricolage Grotesque"…;font-style:italic;font-weight:500` (issu du swap T2) par `font-family:"Hanken Grotesk",system-ui,sans-serif;font-style:normal;font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-size:clamp(13px,1.6vw,15px)` (eyebrow chaleureux au-dessus du titre, plus d'italique serif).
- Vérifier que le titre manifeste du héros (le `h1`/`h2` « 9 mois pour parler indonésien ») est bien en Bricolage 800 (hérité de T1) ; sinon lui appliquer la classe/typo.

- [ ] **Step 4 : Fusion visuelle manifeste + compteur (léger)**

Dans `#tab-home` ([:292+](../../../index.html#L292)) : rapprocher visuellement le compteur « J- / départ » du bloc héros (le placer dans/juste sous le héros, avec `.countdown .big` en `.stat-xxl`-like). **Retouche de placement/among existing markup uniquement** — ne pas ajouter de logique. Lire le HTML de `#tab-home` avant d'éditer pour repérer le bloc `.hero` et la tuile `.countdown`, et réordonner/regrouper au besoin sans casser les autres tuiles.

- [ ] **Step 5 : Vérifier**

Run: `npm test` → `pass 42`. Parse du script inline OK.
Run: `grep -n "font-style:italic" index.html` → vérifier qu'il ne reste pas d'italique serif indésirable sur le héros (`.salam` neutralisé).

- [ ] **Step 6 : Commit**
```bash
git add index.html
git commit -m "feat(reskin): heros accueil (manifeste + J-) et chiffres XXL cibles"
```

---

## Task 5 : Signature botanique + motion

**Files:**
- Modify: `index.html` — assets SVG inline + keyframes + micro-interactions (dans `<style>` et un conteneur d'assets SVG en haut du `<body>`)

**Interfaces:**
- Consumes : tokens (T1). Produces : primitives réutilisées au chantier « Ta journée ».

- [ ] **Step 1 : Assets SVG botaniques (inline, teintables)**

Ajouter, juste après l'ouverture du `<body>`, un bloc SVG masqué de symboles réutilisables (teintables via `currentColor`) :
```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="ic-bloom" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 2c1.7 0 3 1.6 2.7 3.3 1.5-.9 3.4-.2 4 1.4.6 1.6-.4 3.3-2 3.8 1.6.5 2.6 2.2 2 3.8-.6 1.6-2.5 2.3-4 1.4C15 20.4 13.7 22 12 22s-3-1.6-2.7-3.3c-1.5.9-3.4.2-4-1.4-.6-1.6.4-3.3 2-3.8-1.6-.5-2.6-2.2-2-3.8.6-1.6 2.5-2.3 4-1.4C9 3.6 10.3 2 12 2Z"/>
    <circle cx="12" cy="12" r="2.6" fill="var(--sun)"/>
  </symbol>
  <symbol id="ic-sprout" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 21v-6c-3 0-5-2-5-5 3 0 5 2 5 4 0-3 2-5 5-5 0 3-2 5-5 5v7Z"/>
  </symbol>
</svg>
```
(Utilisés pleinement par la grille-jardin du chantier « Ta journée » ; ici on pose les symboles + le style.)

- [ ] **Step 2 : Keyframes d'éclosion + reduced-motion**

Ajouter dans `<style>` :
```css
  @keyframes bloom{0%{transform:scale(.4) rotate(-12deg);opacity:0}60%{transform:scale(1.12) rotate(4deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
  .bloom-in{animation:bloom .6s cubic-bezier(.2,.8,.3,1.2) both}
  .ic-botanic{width:1em;height:1em;display:inline-block;vertical-align:-.12em;color:var(--hibiscus)}
  @media (prefers-reduced-motion: reduce){
    .bloom-in{animation:none}
    *{scroll-behavior:auto}
  }
```

- [ ] **Step 3 : Micro-interactions clés (curées)**

Ajouter/ajuster des transitions discrètes sur les éléments d'action (sans animer le texte statique) :
```css
  .btn{transition:transform .12s ease, background .15s ease}
  .btn:hover{transform:translateY(-1px)}
  .btn:active{transform:translateY(0)}
  .tile{transition:transform .15s ease, border-color .15s ease}
  .tile:hover{transform:translateY(-2px);border-color:var(--line-strong)}
```
Placer ces règles **après** les définitions existantes de `.btn` / `.tile` pour éviter les conflits de spécificité (ne pas dupliquer les propriétés déjà là ; seulement ajouter `transition`/`:hover`/`:active`). Envelopper les `transform` dans le respect de `prefers-reduced-motion` (déjà couvert par la règle globale si on ajoute `.btn,.tile{}` au bloc reduce — ajouter `.btn:hover,.tile:hover{transform:none}` dans le `@media reduce`).

- [ ] **Step 4 : Vérifier**

Run: `npm test` → `pass 42`. Parse du script inline OK.
Vérifier qu'il existe un bloc `@media (prefers-reduced-motion: reduce)` neutralisant `bloom` et les `transform` de hover.

- [ ] **Step 5 : Commit**
```bash
git add index.html
git commit -m "feat(reskin): signature botanique (SVG, eclosion) + micro-interactions"
```

---

## Task 6 : Service worker + balayage final

**Files:**
- Modify: `sw.js` — `CACHE`

- [ ] **Step 1 : Bump du cache**

`sw.js` : remplacer `var CACHE = "bahasa-v5";` par `var CACHE = "bahasa-v6";`.

- [ ] **Step 2 : Balayage de cohérence (revue, pas de navigateur)**

Relire le diff complet du reskin (`git diff <base>..HEAD`) et confirmer :
- plus aucune valeur crème (`#F4EFE3`, `#FBF8F1`) ni couleur d'origine (`#16564C`, `#2E8B79`, `#DD9A1A`, `#C03E29`) codée en dur hors `:root` (les styles inline JS l.1374 utilisaient `#6C786F`/`#16564C` → les retinter en `var(--muted)`/`var(--ocean)` ou valeurs nouvelles). Corriger toute couleur d'origine oubliée.
- Run: `grep -n "#F4EFE3\|#FBF8F1\|#16564C\|#2E8B79\|#DD9A1A\|#C03E29\|16332D" index.html` → ne doit rester que d'éventuelles valeurs voulues ; retinter le reste.

- [ ] **Step 3 : Vérifier**

Run: `npm test` → `pass 42`. Parse du script inline. Run: `node --check sw.js`.

- [ ] **Step 4 : Commit**
```bash
git add index.html sw.js
git commit -m "feat(reskin): bump SW bahasa-v6 + balayage couleurs residuelles"
```

---

## Self-Review (fait pendant la rédaction)

- **Couverture du spec :** tokens/palette (T1), swap polices total + exceptions monospace (T2), flat pop / ombres / labels (T3), héros manifeste+J- & chiffres XXL ciblés (T4), signature botanique + motion + reduced-motion (T5), SW v6 + balayage couleurs résiduelles (T6). Tous les points du spec sont couverts.
- **Placeholders :** aucun « TODO » vague ; chaque étape a des valeurs concrètes. Les assets SVG et keyframes sont fournis en entier. La signature est explicitement « posée ici, pleinement exploitée au chantier Ta journée » (staging assumé).
- **Cohérence des types/valeurs :** noms de variables conservés d'une tâche à l'autre ; les hex de `:root` (T1) sont ceux référencés en T3/T4/T6 ; `.stat-xxl` défini en T4 avant tout usage ; `--sun`/`--hibiscus` définis en T1 et utilisés en T3/T5.
- **Risque connu (à surveiller en revue/impl) :** conflits de spécificité CSS si on ajoute des règles `.btn`/`.tile` concurrentes → n'ajouter que `transition`/`:hover`, après les définitions existantes (noté en T5). Vérification visuelle finale = navigateur, par l'humain (pas de screenshot en sous-agent).
