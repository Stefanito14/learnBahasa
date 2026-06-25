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
  assert.ok(items.length > 150, "au moins 150 mots");
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

test("lessons: structure du fil guidé", () => {
  assert.ok(Array.isArray(DATA.lessons) && DATA.lessons.length >= 7, "au moins 7 leçons");
  assert.ok(DATA.lessons.every((l) => l.id && l.phase && l.title && l.goal && Array.isArray(l.steps) && l.steps.length > 0));
  assert.ok(DATA.lessons.every((l) => l.steps.every((s) => s.text && s.target && s.target.tab)));
  const ids = DATA.lessons.map((l) => l.id);
  assert.strictEqual(new Set(ids).size, ids.length, "ids uniques");
});
