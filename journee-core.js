(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.JourneeCore = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PILLARS = ["study", "read", "listen", "speak", "journal"];
  var PILLAR_LABELS = { study: "Étudier", read: "Lire", listen: "Écouter", speak: "Parler", journal: "Journal" };

  function pillarForStep(step) {
    if (!step) return null;
    if (step.pillar && PILLARS.indexOf(step.pillar) >= 0) return step.pillar;
    var t = step.target || {};
    if (t.anchor === "quiz-listen") return "listen";
    if (t.tab === "grammaire") return "study";
    if (t.tab === "vocab" || t.tab === "phrases") return "read";
    if (t.tab === "prononciation") return "speak";
    if (t.tab === "carnet") return "journal";
    return null;
  }

  function autoForTask(pillar, target) {
    var t = target || {};
    if (pillar === "read") return t.tab === "vocab" || t.anchor === "quiz-voc";
    if (pillar === "listen") return t.anchor === "quiz-listen";
    return false;
  }

  function defaultTaskFor(pillar, ctx) {
    ctx = ctx || {};
    var due = ctx.srsDue == null ? 0 : ctx.srsDue;
    var prompt = ctx.prompt || "Parle 2 minutes à voix haute.";
    var label, target;
    if (pillar === "study") { label = "Relis un point de grammaire."; target = { tab: "grammaire" }; }
    else if (pillar === "read") { label = "Révise tes cartes (" + due + (due > 1 ? " dues" : " due") + ")."; target = { tab: "vocab" }; }
    else if (pillar === "listen") { label = "Quiz d'écoute (5 questions)."; target = { tab: "training", anchor: "quiz-listen" }; }
    else if (pillar === "speak") { label = "Dis à voix haute : « " + prompt + " »"; target = { tab: "carnet" }; }
    else { label = "Écris 2 phrases (journal)."; target = { tab: "carnet" }; }
    return { pillar: pillar, label: label, target: target, auto: autoForTask(pillar, target) };
  }

  function buildDayPlan(lesson, ctx) {
    var steps = (lesson && lesson.steps) || [];
    var plan = [];
    for (var i = 0; i < PILLARS.length; i++) {
      var pillar = PILLARS[i], found = null;
      for (var j = 0; j < steps.length; j++) {
        if (pillarForStep(steps[j]) === pillar) { found = steps[j]; break; }
      }
      if (found) {
        plan.push({ pillar: pillar, label: found.text, target: found.target || {}, auto: autoForTask(pillar, found.target || {}) });
      } else {
        plan.push(defaultTaskFor(pillar, ctx));
      }
    }
    return plan;
  }

  return { PILLARS: PILLARS, PILLAR_LABELS: PILLAR_LABELS, pillarForStep: pillarForStep, autoForTask: autoForTask, defaultTaskFor: defaultTaskFor, buildDayPlan: buildDayPlan };
});
