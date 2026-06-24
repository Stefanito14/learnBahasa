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
  assert.strictEqual(r.hash, AC.fnv1a("apa"));
  const r2 = AC.resolveAudio("inconnu", "f", index);
  assert.strictEqual(r2.type, "tts");
});

test("resolveAudio: accepte aussi un tableau de hashs", () => {
  const r = AC.resolveAudio("apa", "f", [AC.fnv1a("apa")]);
  assert.strictEqual(r.type, "file");
  assert.strictEqual(r.src, "audio/" + AC.fnv1a("apa") + "-f.mp3");
  assert.strictEqual(r.hash, AC.fnv1a("apa"));
});

test("voiceForRole: rôle 0 = préférence, alterne ensuite", () => {
  assert.strictEqual(AC.voiceForRole(0, "f"), "f");
  assert.strictEqual(AC.voiceForRole(1, "f"), "m");
  assert.strictEqual(AC.voiceForRole(2, "f"), "f");
  assert.strictEqual(AC.voiceForRole(0, "m"), "m");
  assert.strictEqual(AC.voiceForRole(1, "m"), "f");
});
