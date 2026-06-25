# Spec — Chantier n°3 (version rapide) : Hébergement + PWA

**Date :** 2026-06-24
**Projet :** Bahasa Indonesia — `index.html` (ex-`plan-indonesien.html`)
**Portée choisie :** « vite vite » = hébergement en ligne + PWA installable/hors-ligne. **Hors périmètre : synchro automatique ordi↔mobile** (nécessite un backend ; laissée pour plus tard, éventuellement via export/import manuel).

## Objectif
Rendre l'appli accessible depuis le téléphone (URL en ligne) et installable / utilisable hors-ligne.

## Décisions
- Repo GitHub passé en **public** (requis pour GitHub Pages gratuit ; contenu non sensible).
- **Renommage** `plan-indonesien.html` → `index.html` (URL propre). Mettre à jour la seule référence interne : `tools/generate-audio.js` (lecture du HTML pour scraper `data-say`).
- **GitHub Pages** servi depuis `main` à la racine → `https://stefanito14.github.io/learnBahasa/`.
- **PWA** :
  - `manifest.json` : name « Bahasa Indonesia », short_name « Bahasa », `start_url`/`scope` = `"./"`, `display` standalone, `theme_color` `#16564C`, `background_color` `#F4EFE3`, icônes 192 & 512 (purpose `any maskable`).
  - **Icônes** PNG générées (192, 512, + apple-touch 180), carré plein couleur océan `#16564C`. Générateur : `tools/make-icons.js` (Node + zlib, sans dépendance).
  - `sw.js` (service worker) : précache la coquille (`index.html`, `audio-core.js`, `data.js`, `audio-index.js`, `srs-core.js`, `manifest.json`, icônes) ; **cache-first** ; runtime-cache des autres GET même-origine (mp3) + polices Google ; fallback `index.html` hors-ligne ; nettoyage des vieux caches à l'activation. Constante de version `CACHE`.
  - `<head>` : `<link rel="manifest">`, `<meta name="theme-color">`, `<link rel="apple-touch-icon">`, métas `apple-mobile-web-app-*`. Enregistrement du SW via un petit `<script>` séparé (hors du grand IIFE).

## Vérification
- De mon côté : `manifest.json` parse en JSON ; `sw.js` passe `node --check` ; les PNG sont des fichiers valides non vides ; le script inline du HTML parse toujours ; `npm test` reste vert.
- ⚠️ Le service worker **ne s'enregistre qu'en HTTPS** (pas en `file://`). La vérif réelle (install, hors-ligne) se fait sur l'**URL GitHub Pages**, sur ordi et mobile (check-list fournie).

## Exécution
Chantier surtout **config** (peu de logique, rien de testable en unitaire) → **implémentation directe** (pas de cérémonial sous-agent par tâche), validée par l'utilisateur acceptée. Travail sur la branche `feat/hosting-pwa`, merge sur `main` puis push.

## Hors périmètre / plus tard
- Synchro automatique de la progression entre appareils (backend).
- Embellissement des icônes.
- Précache complet des 554 mp3 (on reste sur runtime-cache léger).
