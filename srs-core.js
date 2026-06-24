(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.SrsCore = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var BOX_DAYS = [0, 1, 3, 7, 16, 35, 120];

  function clampBox(b) {
    b = b | 0;
    if (b < 1) return 1;
    if (b > 6) return 6;
    return b;
  }

  function intervalForBox(box) {
    return BOX_DAYS[clampBox(box)];
  }

  function addDays(iso, n) {
    var p = String(iso).split("-");
    var d = new Date(Date.UTC(+p[0], (+p[1]) - 1, +p[2]));
    d.setUTCDate(d.getUTCDate() + n);
    var y = d.getUTCFullYear();
    var m = ("0" + (d.getUTCMonth() + 1)).slice(-2);
    var day = ("0" + d.getUTCDate()).slice(-2);
    return y + "-" + m + "-" + day;
  }

  function nextState(prev, knewIt, todayISO) {
    var base = prev ? prev.box : 1;
    var box = knewIt ? clampBox(base + 1) : 1;
    return { box: box, due: addDays(todayISO, intervalForBox(box)) };
  }

  function isDue(state, todayISO) {
    if (!state) return true;
    return state.due <= todayISO;
  }

  function dueIds(srsMap, allIds, todayISO) {
    var seen = [], unseen = [];
    for (var i = 0; i < allIds.length; i++) {
      var id = allIds[i], st = srsMap[id];
      if (!st) { unseen.push(id); continue; }
      if (st.due <= todayISO) seen.push({ id: id, due: st.due });
    }
    seen.sort(function (a, b) { return a.due < b.due ? -1 : (a.due > b.due ? 1 : 0); });
    var out = [];
    for (var j = 0; j < seen.length; j++) out.push(seen[j].id);
    return out.concat(unseen);
  }

  function masteredCount(srsMap) {
    var n = 0;
    for (var k in srsMap) {
      if (Object.prototype.hasOwnProperty.call(srsMap, k) && srsMap[k] && srsMap[k].box === 6) n++;
    }
    return n;
  }

  return {
    BOX_DAYS: BOX_DAYS,
    intervalForBox: intervalForBox,
    addDays: addDays,
    nextState: nextState,
    isDue: isDue,
    dueIds: dueIds,
    masteredCount: masteredCount
  };
});
