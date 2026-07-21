"use strict";
const test = require("node:test");
const assert = require("node:assert");
const CH = require("../challenge-core.js");

const T = "2026-07-21";
function full(){ return { study:true, read:true, listen:true, speak:true, journal:true }; }

test("constantes exposées", () => {
  assert.deepStrictEqual(CH.PILLARS, ["study","read","listen","speak","journal"]);
  assert.strictEqual(CH.XP_PER_PILLAR, 10);
  assert.strictEqual(CH.FULL_DAY_BONUS, 20);
  assert.strictEqual(CH.TARGET_DAYS, 75);
  assert.deepStrictEqual(CH.MILESTONES, [7,21,50,75]);
});

test("setPillar: crée le jour, ne mute pas l'entrée, pose startDate", () => {
  const s0 = { startDate:null, days:{} };
  const s1 = CH.setPillar(s0, T, "study", true);
  assert.strictEqual(s0.days[T], undefined);
  assert.strictEqual(s1.days[T].study, true);
  assert.strictEqual(s1.startDate, T);
});

test("setPillar: value défaut true, décoche avec false, ignore inconnu", () => {
  let s = CH.setPillar({startDate:T,days:{}}, T, "speak");
  assert.strictEqual(s.days[T].speak, true);
  s = CH.setPillar(s, T, "speak", false);
  assert.strictEqual(s.days[T].speak, false);
  const s2 = CH.setPillar({startDate:T,days:{}}, T, "bogus", true);
  assert.strictEqual(s2.days[T], undefined);
});

test("dayPillars: défaut tout-false si jour absent", () => {
  assert.deepStrictEqual(CH.dayPillars({days:{}}, T), CH.emptyDay());
});

test("dayCount / dayComplete", () => {
  assert.strictEqual(CH.dayCount({study:true,read:true}), 2);
  assert.strictEqual(CH.dayComplete(full()), true);
  assert.strictEqual(CH.dayComplete({study:true}), false);
});

test("xpForDay: 10/pilier, +20 si complet", () => {
  assert.strictEqual(CH.xpForDay({study:true,read:true}), 20);
  assert.strictEqual(CH.xpForDay(full()), 70);
  assert.strictEqual(CH.xpForDay(CH.emptyDay()), 0);
});

test("totalXp: somme multi-jours", () => {
  const s = { days: { "2026-07-21": full(), "2026-07-22": {study:true,read:true} } };
  assert.strictEqual(CH.totalXp(s), 90);
});

test("daysCompleted: compte les pleines, ignore partielles", () => {
  const s = { days: { a: full(), b: {study:true}, c: full() } };
  assert.strictEqual(CH.daysCompleted(s), 2);
});

test("progress: done/total/pct, plafond 75", () => {
  const days = {};
  for (let i=0;i<80;i++) days["d"+i] = full();
  const p = CH.progress({days});
  assert.strictEqual(p.done, 75);
  assert.strictEqual(p.total, 75);
  assert.strictEqual(p.pct, 100);
});

test("streak: jours pleins consécutifs finissant aujourd'hui", () => {
  const s = { days: { "2026-07-19": full(), "2026-07-20": full(), "2026-07-21": full() } };
  assert.strictEqual(CH.streak(s, "2026-07-21"), 3);
});

test("streak: tolérance aujourd'hui vide mais hier plein", () => {
  const s = { days: { "2026-07-20": full() } };
  assert.strictEqual(CH.streak(s, "2026-07-21"), 1);
});

test("streak: un trou coupe la série", () => {
  const s = { days: { "2026-07-18": full(), "2026-07-20": full(), "2026-07-21": full() } };
  assert.strictEqual(CH.streak(s, "2026-07-21"), 2);
});

test("streak: journée partielle aujourd'hui -> repart d'hier plein", () => {
  const s = { days: { "2026-07-20": full(), "2026-07-21": {study:true} } };
  assert.strictEqual(CH.streak(s, "2026-07-21"), 1);
});

test("streak: 0 si rien", () => {
  assert.strictEqual(CH.streak({days:{}}, "2026-07-21"), 0);
});

test("ringsForToday = piliers du jour", () => {
  const s = { days: { "2026-07-21": {study:true} } };
  assert.strictEqual(CH.ringsForToday(s, "2026-07-21").study, true);
  assert.strictEqual(CH.ringsForToday(s, "2026-07-21").read, false);
});

test("badgesUnlocked: paliers de journées franchis", () => {
  const d7 = {}; for (let i=0;i<7;i++) d7["d"+i]=full();
  assert.deepStrictEqual(CH.badgesUnlocked({days:d7}), [7]);
  const d21 = {}; for (let i=0;i<21;i++) d21["d"+i]=full();
  assert.deepStrictEqual(CH.badgesUnlocked({days:d21}), [7,21,"xp"]);
});

test("badgesUnlocked: badge xp à 1000 XP", () => {
  const d = {}; for (let i=0;i<15;i++) d["d"+i]=full(); // 15*70 = 1050 XP, 15 journées
  const b = CH.badgesUnlocked({days:d});
  assert.ok(b.indexOf(7) >= 0);
  assert.ok(b.indexOf("xp") >= 0);
});
