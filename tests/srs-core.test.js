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
