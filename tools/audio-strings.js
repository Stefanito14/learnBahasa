"use strict";
const AudioCore = require("../audio-core.js");

function collectStrings(data, htmlSource) {
  const out = [];
  const seen = Object.create(null);
  function add(s) {
    const n = AudioCore.normalize(s);
    if (!n || seen[n]) return;
    seen[n] = true;
    out.push(n);
  }

  (data.vocab || []).forEach((t) => (t.items || []).forEach((it) => add(it.id)));
  (data.food || []).forEach((f) => add(f[0]));
  (data.phrases || []).forEach((g) => (g.rows || []).forEach((r) => add(r[1])));
  (data.dialogues || []).forEach((d) => (d.lines || []).forEach((l) => add(l[1])));
  (data.drills || []).forEach((dr) =>
    (dr.chips || []).forEach((c) => add((dr.frame || "").replace("___", c[0])))
  );

  if (htmlSource) {
    const re = /data-say="([^"]*)"/g;
    let m;
    while ((m = re.exec(htmlSource))) {
      // Skip JS template fragments from the page source (real phrases never contain + < >)
      if (/[+<>]/.test(m[1])) continue;
      add(m[1]);
    }
  }
  return out;
}

module.exports = { collectStrings };
