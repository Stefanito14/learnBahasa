"use strict";
const test = require("node:test");
const assert = require("node:assert");
const JC = require("../journee-core.js");

const CTX = { srsDue: 12, prompt: "Présente-toi." };

test("PILLARS et labels", () => {
  assert.deepStrictEqual(JC.PILLARS, ["study","read","listen","speak","journal"]);
  assert.strictEqual(JC.PILLAR_LABELS.read, "Lire");
});

test("pillarForStep: champ explicite prioritaire", () => {
  assert.strictEqual(JC.pillarForStep({ pillar:"speak", target:{tab:"grammaire"} }), "speak");
});

test("pillarForStep: heuristique target en secours", () => {
  assert.strictEqual(JC.pillarForStep({ target:{tab:"grammaire"} }), "study");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"vocab", theme:"X"} }), "read");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"phrases"} }), "read");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"training", anchor:"quiz-listen"} }), "listen");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"prononciation", anchor:"shadowing"} }), "speak");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"prononciation"} }), "speak");
  assert.strictEqual(JC.pillarForStep({ target:{tab:"carnet"} }), "journal");
  assert.strictEqual(JC.pillarForStep({}), null);
});

test("autoForTask: seulement les activites reellement detectees", () => {
  assert.strictEqual(JC.autoForTask("read", {tab:"vocab"}), true);
  assert.strictEqual(JC.autoForTask("read", {tab:"training", anchor:"quiz-voc"}), true);
  assert.strictEqual(JC.autoForTask("read", {tab:"phrases"}), false);
  assert.strictEqual(JC.autoForTask("listen", {tab:"training", anchor:"quiz-listen"}), true);
  assert.strictEqual(JC.autoForTask("listen", {tab:"prononciation"}), false);
  assert.strictEqual(JC.autoForTask("study", {tab:"grammaire"}), false);
  assert.strictEqual(JC.autoForTask("speak", {tab:"carnet"}), false);
});

test("defaultTaskFor: read injecte srsDue, speak injecte prompt", () => {
  const r = JC.defaultTaskFor("read", CTX);
  assert.ok(r.label.indexOf("12") >= 0);
  assert.deepStrictEqual(r.target, { tab:"vocab" });
  assert.strictEqual(r.auto, true);
  const s = JC.defaultTaskFor("speak", CTX);
  assert.ok(s.label.indexOf("Présente-toi.") >= 0);
  assert.strictEqual(s.auto, false);
  const l = JC.defaultTaskFor("listen", CTX);
  assert.deepStrictEqual(l.target, { tab:"training", anchor:"quiz-listen" });
  assert.strictEqual(l.auto, true);
  const st = JC.defaultTaskFor("study", CTX);
  assert.deepStrictEqual(st.target, { tab:"grammaire" });
  const j = JC.defaultTaskFor("journal", CTX);
  assert.deepStrictEqual(j.target, { tab:"carnet" });
});

test("buildDayPlan: 5 taches dans l'ordre, lecon prioritaire, defauts en complement", () => {
  const lesson = { id:"x", title:"T", steps: [
    { text:"Apprends les cartes.", target:{tab:"vocab", theme:"X"}, pillar:"read" },
    { text:"Lis la grammaire.", target:{tab:"grammaire"}, pillar:"study" },
    { text:"Dis-le a voix haute.", target:{tab:"carnet"}, pillar:"speak" }
  ]};
  const plan = JC.buildDayPlan(lesson, CTX);
  assert.strictEqual(plan.length, 5);
  assert.deepStrictEqual(plan.map(t => t.pillar), JC.PILLARS);
  assert.strictEqual(plan[0].label, "Lis la grammaire.");        // study <- lecon
  assert.strictEqual(plan[1].label, "Apprends les cartes.");     // read <- lecon
  assert.ok(plan[2].label.length > 0);                            // listen <- defaut
  assert.strictEqual(plan[2].auto, true);
  assert.strictEqual(plan[3].label, "Dis-le a voix haute.");     // speak <- lecon
  assert.strictEqual(plan[3].auto, false);
  assert.ok(plan[4].target.tab === "carnet");                     // journal <- defaut
});

test("buildDayPlan: premiere etape par pilier seulement", () => {
  const lesson = { steps: [
    { text:"A", target:{tab:"vocab"}, pillar:"read" },
    { text:"B", target:{tab:"phrases"}, pillar:"read" }
  ]};
  const plan = JC.buildDayPlan(lesson, CTX);
  assert.strictEqual(plan[1].label, "A");
});

test("buildDayPlan: lesson null => consolidation (5 defauts)", () => {
  const plan = JC.buildDayPlan(null, CTX);
  assert.strictEqual(plan.length, 5);
  assert.ok(plan.every(t => t.label && t.target));
  assert.strictEqual(plan[1].auto, true);   // read defaut
  assert.strictEqual(plan[2].auto, true);   // listen defaut
});
