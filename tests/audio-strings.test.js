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

test("ignore les fragments de template JS dans data-say", () => {
  const html = '<button data-say="Apa kabar?">a</button><button data-say="\'+it.id.replace(/">b</button>';
  const got = collectStrings({ vocab: [], food: [], phrases: [], dialogues: [], drills: [] }, html);
  assert.ok(got.includes("Apa kabar?"), "garde une vraie phrase");
  assert.ok(!got.some((s) => /[+<>]/.test(s)), "exclut les fragments avec + < >");
});
