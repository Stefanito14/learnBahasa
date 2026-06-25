"use strict";
const test = require("node:test");
const assert = require("node:assert");
const P = require("../parcours-core.js");

test("isLessonDone", () => {
  assert.strictEqual(P.isLessonDone({ a: "done" }, "a"), true);
  assert.strictEqual(P.isLessonDone({ a: "done" }, "b"), false);
  assert.strictEqual(P.isLessonDone(null, "a"), false);
  assert.strictEqual(P.isLessonDone({ a: "x" }, "a"), false);
});

test("nextLessonId: première non faite ; null si toutes faites", () => {
  assert.strictEqual(P.nextLessonId(["a", "b", "c"], {}), "a");
  assert.strictEqual(P.nextLessonId(["a", "b", "c"], { a: "done" }), "b");
  assert.strictEqual(P.nextLessonId(["a", "b", "c"], { a: "done", c: "done" }), "b");
  assert.strictEqual(P.nextLessonId(["a", "b"], { a: "done", b: "done" }), null);
  assert.strictEqual(P.nextLessonId([], {}), null);
});

test("lessonsProgress: done/total/pct arrondi", () => {
  assert.deepStrictEqual(P.lessonsProgress(["a", "b", "c", "d"], { a: "done", b: "done" }), { done: 2, total: 4, pct: 50 });
  assert.deepStrictEqual(P.lessonsProgress([], {}), { done: 0, total: 0, pct: 0 });
  assert.deepStrictEqual(P.lessonsProgress(["a", "b", "c"], { a: "done" }), { done: 1, total: 3, pct: 33 });
});
