# Spec — Chantier n°1 : Audio fiable + Écoute

**Date :** 2026-06-24
**Projet :** Bahasa Indonesia — plateforme d'apprentissage (`plan-indonesien.html`)
**Objectif global :** être opérationnel à l'oral en indonésien pour un voyage en mars 2027.

---

## 1. Contexte

L'application est aujourd'hui **un seul fichier HTML autonome** (`plan-indonesien.html`) avec 10 onglets,
un suivi de progression, des flashcards, des quiz, un calendrier de 36 semaines et un carnet de bord.

Le son repose entièrement sur la **Web Speech API** : `say(text)` demande à l'appareil de lire le texte
en `id-ID`. Sur beaucoup de machines (desktop, iOS) aucune voix indonésienne n'est installée → lecture
avec un accent anglais/français, ou silence. C'est un point faible majeur pour une langue qu'on veut
apprendre **à l'oreille**.

## 2. Objectif du chantier

1. **Audio fiable** : remplacer le son aléatoire par de vrais fichiers audio en voix indonésienne
   naturelle, identiques et de qualité **partout** (y compris hors-ligne).
2. **Écoute** : ajouter de la vraie pratique d'écoute qui exploite ce bon son.

## 3. Décisions verrouillées (issues du brainstorming)

| Sujet | Décision |
|---|---|
| Hébergement à terme | En ligne (statique gratuit) — détails au chantier n°3 |
| Approche audio | **Vrais fichiers audio pré-générés** + repli sur la voix du navigateur |
| Voix | **Les deux** : féminine `id-ID-GadisNeural` + masculine `id-ID-ArdiNeural` |
| Bonus dialogues | Chaque rôle d'un dialogue parle avec une voix différente |
| Dictée | **Reportée en v2** |
| Structure | Le projet passe de « 1 fichier » à « 1 page + dossier `audio/` » (assumé, car hébergé) |

## 4. Non-objectifs (hors de ce chantier)

- Répétition espacée / SRS → **chantier n°2**
- Synchronisation multi-appareils & hébergement concret → **chantier n°3**
- Production active (réponses tapées, enregistrement micro) → parqué
- Dictée, réglage de vitesse de lecture → **v2** de ce chantier

---

## 5. Design

### 5.1 Pipeline de génération audio (étape de build, une seule fois)

**Source des chaînes à voix.** On rassemble toutes les chaînes indonésiennes uniques depuis les données
existantes :

- `VOCAB[].items[].id` (≈ 250 mots)
- Phrases de survie (colonne indonésienne)
- Lignes de dialogues
- Exemples de prononciation et de grammaire (attributs `data-say` statiques)
- Phrases construites des *pattern drills* (gabarit × chaque puce)
- Plats (onglet Immersion)

> **Refactor ciblé justifié :** pour garantir que le générateur et la page parlent des mêmes chaînes,
> on extrait ces données dans un fichier partagé **`data.js`** (qui pose `window.BAHASA_DATA`).
> La page le charge via `<script src="data.js">` ; le générateur lit le même fichier. Plus de risque
> de décalage entre l'audio généré et ce que la page demande. Les chaînes encore codées en dur dans le
> HTML (exemples prononciation/grammaire) sont collectées en parallèle via leurs attributs `data-say`.

**Outil.** Script de génération avec **`edge-tts`** (paquet Python, gratuit, sans compte, voix neuronales
en ligne de Microsoft Edge). Tout équivalent produisant du mp3 `id-ID` neuronal convient.

**Paramètres.**
- Voix : `id-ID-GadisNeural` (féminine) et `id-ID-ArdiNeural` (masculine).
- Vitesse : légèrement ralentie pour l'apprentissage (`--rate=-8%`).
- Format : mp3 mono.

**Nommage & index.**
- Identifiant de fichier = hash déterministe (FNV-1a 32 bits → hex) de la chaîne **normalisée**.
- `normalize(s)` = `trim` + espaces internes réduits à une espace simple. La **même** fonction est
  implémentée côté build et côté page → les hashs concordent par construction.
- Fichiers : `audio/<hash>-f.mp3` (féminine) et `audio/<hash>-m.mp3` (masculine).
- Le générateur écrit **`audio-index.js`** qui pose `window.AUDIO_INDEX = [ ...hashs disponibles... ]`.
  Chargé par `<script>` (fonctionne aussi en `file://`, pas de `fetch`).

### 5.2 Lecture audio à l'exécution (refonte de `say()`)

```
voicePref ∈ { 'f', 'm' }            // préférence persistée (Store), défaut 'f'
INDEX = new Set(window.AUDIO_INDEX) // hashs disponibles

say(text, opts):
    v = opts.voice || voicePref
    h = fnv1a(normalize(text))
    if INDEX.has(h):
        jouer  audio/<h>-<v>.mp3   (élément <audio> réutilisé)
        si erreur de lecture → repli TTS
    else:
        repli TTS (comportement actuel)   // ex. nombres aléatoires du quiz
```

- Un seul élément `<audio>` réutilisé ; `cancel`/`pause` avant chaque lecture (comme le `speechSynthesis.cancel()` actuel).
- **Sélecteur de voix ♀/♂** : petit interrupteur (barre du haut), persisté via `Store` sous la clé `voice`.
- **Aucune régression** : tout ce qui n'a pas de fichier (nombres tirés au hasard) garde la voix du navigateur.

### 5.3 Voix par rôle dans les dialogues (bonus)

- Chaque dialogue a des lignes `[rôle, indonésien, traduction]`.
- Mapping rôle → voix : le rôle « Vous » prend `voicePref`, l'autre interlocuteur prend la voix opposée.
- Chaque bouton 🔊 de ligne appelle `say(ligne, {voice})` avec la voix du rôle.

### 5.4 Écoute — fonctionnalités

**A. Mode « écoute d'abord » sur les dialogues** *(onglet Phrases & Dialogues)*
- Bouton **▶️ Écouter le dialogue** par carte : joue les lignes en séquence, voix par rôle,
  en surlignant la ligne en cours.
- Bouton bascule **👁️ Masquer le texte** : cache le texte indonésien pour écouter d'abord, puis révéler.

**B. Nouveau « Quiz d'écoute »** *(onglet Entraînement)*
- Même ossature que le quiz de vocabulaire existant, mais l'énoncé est **sonore** : un 🔊 (lecture auto)
  d'un mot/phrase indonésien ; 4 propositions de **sens en français** ; choisir le bon.
- Bouton **rejouer** l'audio. Score suivi comme les autres quiz.
- Tirage limité aux éléments qui **ont un fichier audio** (présents dans l'index).

## 6. Structure du projet après le chantier

```
learnBahasa/
  plan-indonesien.html      # la page (renommage en index.html prévu au déploiement, chantier n°3)
  data.js                   # données langue partagées (window.BAHASA_DATA)
  audio-index.js            # window.AUDIO_INDEX = [...] (généré)
  audio/
    <hash>-f.mp3            # voix féminine
    <hash>-m.mp3            # voix masculine
  tools/
    generate-audio.py       # script de génération (non déployé)
  docs/superpowers/specs/   # specs
```

Volume estimé : ≈ 400 chaînes × 2 voix ≈ **800 mp3** courts, quelques Mo au total. Anodin.

## 7. Vérification

- Génération d'un petit sous-ensemble d'abord → vérifier en navigateur que le mp3 se joue.
- Le sélecteur ♀/♂ change bien de fichier.
- Un nombre aléatoire du quiz retombe correctement sur la voix du navigateur (repli OK).
- « Écouter le dialogue » enchaîne les lignes avec **deux voix** et surligne la ligne courante.
- Le « Quiz d'écoute » joue l'audio, accepte/rejette les réponses et tient le score.
- Vérification responsive (devtools mobile) ; le test sur vrai mobile viendra avec l'hébergement (chantier n°3).

## 8. Risques & parades

| Risque | Parade |
|---|---|
| `edge-tts` indisponible / hors-ligne au build | Outil de génération interchangeable ; tout TTS `id-ID` neuronal produisant du mp3 convient |
| Décalage build ↔ runtime sur les chaînes | Source unique `data.js` + `normalize()` identique des deux côtés |
| Fichier audio manquant à l'exécution | Repli automatique sur la voix du navigateur |
| Poids des fichiers | mp3 mono, voix ralentie ; ~quelques Mo, négligeable |

## 9. Questions ouvertes

Aucune bloquante. Le renommage `plan-indonesien.html` → `index.html` est repoussé au chantier n°3 (hébergement).
