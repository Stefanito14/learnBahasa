# Spec — Reskin « Tropiques vivants » (design-system)

**Date :** 2026-07-21
**Projet :** Bahasa Indonesia — `index.html`
**Problème :** l'UI actuelle a les « tells » du design IA par défaut (fond crème `#F4EFE3`, display serif Fraunces, étiquettes Space Mono en majuscules, trio terreux, cartes à ombre douce). On veut une **identité visuelle sur-mesure**, distinctive, qui ne se reconnaît plus comme « fait par Claude ».

## Objectif
Poser un **design-system « Tropiques vivants »** (fintech-pop maîtrisé + signature botanique indonésienne) et **repeindre tout le site** via l'échange des tokens CSS existants. Direction : blocs de couleur saturés, gros chiffres ciblés, aplats nets sans ombre, typo forte — sauvé du générique fintech par une **signature botanique** (progression qui fleurit).

## Décisions verrouillées (brainstorming)
- **Direction** : Tropical pop **maîtrisé/adulte**, référence **fintech pop** (Revolut/Monzo).
- **Palette** : quitte le crème → fond **menthé** ; jade / hibiscus / soleil / nuit-verte.
- **Typo** : abandonne serif+mono (les 2 tells) → **Bricolage Grotesque** (display + chiffres) + **Hanken Grotesk** (texte).
- **Formes** : arrondi **mesuré**, aplats nets, **zéro ombre douce**.
- **Fond** : **aplat menthé uni** (pas de texture, pas de dégradé).
- **Thème** : **clair uniquement**.
- **Animation** : **entre ciblée et généreuse** — un moment signature + micro-interactions clés + touches d'ambiance curées ; `prefers-reduced-motion` respecté.
- **Iconographie** : **mix emoji + SVG botaniques maison** (SVG pour la signature).
- **Signature** : « la progression qui fleurit » 🌺 (motifs botaniques + éclosion 5/5).
- **Portée** : **design-system global** (tokens + composants de base) → repeint tout ; peaufinage des écrans clés (accueil, Challenge, Parcours).
- **Héros accueil** : **manifeste « 9 mois pour parler indonésien » + compteur J- fusionnés**, gros Bricolage ; carte « Ta journée » juste dessous (la carte elle-même = livrée au chantier « Ta journée » ultérieur).
- **Gros chiffres** : **ciblés** (streak, XP du jour, J-, progression).

## Non-objectifs
- Le chantier fonctionnel **« Ta journée »** (rebuild du Challenge en checklist) — spec séparée, implémentée APRÈS ce reskin, hérite de ces tokens.
- Thème sombre (plus tard).
- Réécriture de contenu / nouvelles leçons.
- Refonte de la structure de navigation (les onglets restent).

---

## Design

### 1. Approche : échange de tokens (faible churn, repeint global)
Le site utilise déjà des variables CSS (`:root`, [index.html:17-20](../../../index.html#L17-L20)) et un petit nombre de classes typo. On **garde les noms de variables** et on **change leurs valeurs** → tout le site est repeint sans réécrire chaque règle.

**Palette — nouvelles valeurs (mêmes noms) :**
| Variable | Avant | Après | Rôle |
|---|---|---|---|
| `--paper` | `#F4EFE3` | `#F4FBF7` | fond menthé (page) |
| `--card` | `#FBF8F1` | `#FFFFFF` | surface bloc/carte (plate) |
| `--card2` | `#fff` | `#FFFFFF` | surface alt |
| `--ink` | `#16332D` | `#0C2A24` | texte (nuit verte) |
| `--ocean` | `#16564C` | `#0FB88F` | **jade** — primaire (nav active, liens, boutons) |
| `--jade` | `#2E8B79` | `#0A7C63` | **palm** — profondeur / survol |
| `--turmeric` | `#DD9A1A` | `#FFC53D` | **soleil** — focus, highlights, streak/XP |
| `--merah` | `#C03E29` | `#FF4D79` | **hibiscus** — action forte / célébration |
| `--muted` | `#6C786F` | `#5C726B` | texte secondaire |
| `--line` | `rgba(22,51,45,.12)` | `rgba(12,42,36,.12)` | traits |
| `--line-strong` | `rgba(22,51,45,.22)` | `rgba(12,42,36,.20)` | traits marqués |
| `--shadow` | (ombre douce) | `none` | **flat pop** — séparation par bordures |
| `--r` | `16px` | `14px` | arrondi mesuré |

**Nouveaux tokens à ajouter :** `--r-sm:8px; --r-pill:999px; --sun:#FFC53D; --hibiscus:#FF4D79;` (alias explicites de rôle, pour la signature et les composants neufs).

> Remplacer `--shadow` par `none` aplatit tout. Les composants qui s'appuyaient sur l'ombre pour se détacher gardent déjà une `border:1px solid var(--line)` → vérifier au passage que chaque surface a une bordure nette (ajouter là où il n'y en a pas).

### 2. Typographie
- **Lien Google Fonts** ([index.html:15](../../../index.html#L15)) : remplacer `Fraunces + Inter + Space Mono` par **`Bricolage Grotesque`** (wght 400;600;700;800) + **`Hanken Grotesk`** (wght 400;500;600;700;800).
- **Body** ([index.html:24](../../../index.html#L24)) : `font-family:"Hanken Grotesk",system-ui,sans-serif`.
- **Titres `h1–h4`** ([index.html:28](../../../index.html#L28)) : `font-family:"Bricolage Grotesque",sans-serif; font-weight:800; letter-spacing:-0.02em`.
- **`.brand`** : Bricolage 800.
- **Étiquettes** — on **supprime Space Mono** :
  - `.eyebrow` ([index.html:30](../../../index.html#L30)), `.tile .k` ([index.html:76](../../../index.html#L76)), `.nav-parent` mobile ([index.html:59](../../../index.html#L59)) : passer en **Hanken Grotesk 700, uppercase, letter-spacing .08em** (plus serré que le mono, moins « tell »).
  - `.mono` ([index.html:27](../../../index.html#L27)) : réaffecter à Hanken (ou conserver la classe mais sans police mono) ; retirer l'usage décoratif là où ce n'est pas de la donnée technique.
- **Chiffres XXL (signature fintech)** : nouvelle utilitaire `.stat-xxl{font-family:"Bricolage Grotesque";font-weight:800;font-size:clamp(40px,7vw,84px);line-height:.92;letter-spacing:-.03em}` — à appliquer, **ciblé**, sur streak, XP du jour, J-, % progression.
- **Retirer l'italique serif** `.hero .salam` (Fraunces italic, [index.html:70](../../../index.html#L70)) → Bricolage ou Hanken italique/medium, couleur `--ocean` (jade).

### 3. Formes & profondeur (flat pop)
- Rayons : sections/cartes `var(--r)` (14px), petits éléments `--r-sm`, boutons/chips « pilule » `--r-pill` (arrondi présent mais mesuré).
- **Aucune ombre** : `--shadow:none`. Séparation par **bordures nettes** (`--line`) et **aplats de couleur**. Optionnel : accent de 3–4px en couleur de rôle (barre latérale colorée sur une carte clé) plutôt qu'une ombre.
- Boutons : aplat `--ocean` (jade) texte blanc pour l'action principale ; **hibiscus** `--merah` pour l'action forte/célébration ; états `:hover` = `--jade` (palm) ; focus visible = contour `--turmeric` (déjà en place).

### 4. Composants de base (héritent des tokens, retouches ciblées)
Restyler pour le flat pop (retrait ombres, nouveaux accents) :
- **Header/nav** ([index.html:32-60](../../../index.html#L32-L60)) : barre menthée, onglet actif en aplat jade (déjà `--ocean`), sous-menus sans ombre (bordure nette).
- **Tiles / stat** ([index.html:75-78](../../../index.html#L75-L78)) : surface blanche, bordure nette, `.k` en label Hanken, `.countdown .big` → `.stat-xxl` en `--merah` (hibiscus) ou `--ink`.
- **Section heads / eyebrows / numéros `01/02`** : garder la **numérotation uniquement là où c'est une vraie séquence** (étapes, process) ; ailleurs, la traiter comme label discret (ne pas décorer). (À appliquer avec discernement, pas de refonte de contenu.)
- **Chips, boutons quiz `.opt`, flashcards, drills, dialogues, log items** : mêmes règles (aplat, bordure, arrondi mesuré, accents jade/hibiscus/soleil). États `.good`/`.bad` des quiz : `--ocean` (jade) / `--merah` (hibiscus).
- **Inputs / formulaires (Carnet)** : bordure nette, focus `--turmeric`.

### 5. Signature « la progression qui fleurit » 🌺
Système réutilisable (posé maintenant, pleinement exploité au chantier « Ta journée ») :
- **Assets SVG botaniques maison** (inline, monochromes teintables via `currentColor`) : au moins 1 fleur (hibiscus stylisé), 1 feuille/pousse. Stockés inline dans `index.html` (cohérent PWA, teintables).
- **Motif de progression** : préparer les classes pour que les cases « journée » puissent devenir des **marques botaniques** (une pousse → une fleur quand la journée est pleine) plutôt que des carrés. (Le rendu final de la grille du Challenge = chantier « Ta journée ».)
- **Célébration 5/5** : keyframes d'**éclosion de pétales** (`@keyframes bloom`) + variante `prefers-reduced-motion` (apparition simple sans mouvement). Réutilise/complète le mécanisme de toast existant.
- **Emoji conservés** là où c'est pratique et lisible (🔥 streak, 🎉) ; SVG maison pour la signature.

### 6. Motion (entre ciblée et généreuse, curée)
- Durées : micro-interactions 120–200ms ; transition d'onglet légère (opacité/translate 8px) ; **moment signature** (éclosion) ~500–700ms.
- Micro-interactions clés : `:hover`/`:active` sur boutons & tuiles (léger scale ≤1.02 ou changement d'aplat), validation (coche), apparition de carte.
- **`@media (prefers-reduced-motion: reduce)`** : neutralise translations/scales/éclosion (états finaux instantanés).
- Pas d'animation « gratuite » sur du texte statique ou en boucle permanente.

### 7. Héros accueil (`#tab-home`)
- **Manifeste + compteur fusionnés** : « **9 mois pour parler indonésien.** » en gros Bricolage 800, avec le **J- (départ)** intégré au bloc héros (via `.stat-xxl` pour le nombre). Retirer l'italique serif.
- Juste dessous : emplacement réservé à la **carte « Ta journée »** (livrée au chantier « Ta journée » ; ici on prépare l'emplacement/section, pas la logique).
- Les tuiles (révisions dues, % parcours) restent, restylées (flat).
- Le mini-encart à ronds actuel (`#ch-mini`) sera de toute façon remplacé au chantier « Ta journée » — ici, juste s'assurer qu'il hérite proprement des tokens (pas de refonte bespoke).

### 8. Service worker
- `sw.js` : bump `CACHE` → **`bahasa-v6`** (les polices Google sont mises en cache au runtime ; le bump force le rafraîchissement de `index.html`).

### 9. Critique anti-défaut (revue du plan de design)
- Le look **fintech-pop** (aplats saturés + gros chiffres) n'est **aucun des 3 clichés IA** (crème-éditorial explicitement abandonné, sombre-acide, broadsheet). Risque résiduel : le générique « SaaS/fintech ». **Différenciateurs** assumés : palette tropicale spécifique (jade/hibiscus/soleil), **fond menthé** (pas blanc/gris), **Bricolage** (pas Inter/Aeonik), et surtout la **signature botanique** (progression qui fleurit) — c'est elle qui rend le tout unique. On dépense l'audace **à un seul endroit** (la signature + les chiffres XXL) et on garde le reste discipliné.

## Vérification
- **Pas de test unitaire** (changements CSS/typo). Vérification **navigateur (manuel)** :
  - Aucune trace du crème/serif/mono : fond menthé, titres Bricolage, labels Hanken, plus d'ombres douces (aplats + bordures nettes).
  - Palette appliquée partout (nav active jade, focus soleil, actions/hibiscus) sur **tous les onglets** (accueil, Parcours, Grammaire, Vocab, Phrases, Prononciation, Culture, Immersion, Entraînement, Carnet).
  - Héros accueil : manifeste + J- en gros Bricolage, sans italique serif.
  - Chiffres XXL ciblés (streak/XP/J-/%), pas partout.
  - Contraste texte suffisant (AA) sur fond menthé et sur aplats colorés (vérifier `--muted`, boutons hibiscus texte blanc).
  - Focus clavier visible ; `prefers-reduced-motion` neutralise les animations.
  - Polices chargées puis servies hors-ligne (SW `bahasa-v6`, cache runtime des fonts).
- **Parité fonctionnelle** : aucun comportement JS cassé (les changements sont visuels ; vérifier qu'aucune règle ne casse la lisibilité des états `.on/.good/.bad`). `npm test` (42) reste vert (aucune logique touchée).

## Risques & parades
| Risque | Parade |
|---|---|
| Contraste insuffisant (jade/soleil sur menthé) | vérifier AA ; texte sur boutons colorés en blanc ou `--ink` selon le fond |
| `--shadow:none` casse la séparation de certains blocs | ajouter `border:1px solid var(--line)` aux surfaces qui s'appuyaient sur l'ombre |
| Police non chargée au 1er rendu (FOUT) | `display:swap` (déjà) + `system-ui` en fallback ; polices mises en cache au runtime par le SW |
| Régression de lisibilité des états quiz `.good/.bad` | mapper explicitement jade/hibiscus et tester le quiz |
| Sélecteurs CSS qui s'annulent (spécificité) | privilégier la modif des **valeurs de variables** plutôt que de nouvelles règles concurrentes |
| Numérotation `01/02` décorative persistante | la conserver seulement sur de vraies séquences ; sinon label discret |

## Hors périmètre / plus tard
- Chantier « Ta journée » (rebuild Challenge en checklist) — hérite de ces tokens.
- Thème sombre.
- Illustrations/photos ; refonte de la nav ; réécriture de contenu.
