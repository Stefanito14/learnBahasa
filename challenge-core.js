(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.ChallengeCore = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PILLARS = ["study", "read", "listen", "speak", "journal"];
  var XP_PER_PILLAR = 10;
  var FULL_DAY_BONUS = 20;
  var TARGET_DAYS = 75;
  var MILESTONES = [7, 21, 50, 75];
  var XP_BADGE = 1000;

  function emptyDay() {
    return { study: false, read: false, listen: false, speak: false, journal: false };
  }

  function dayPillars(state, dayISO) {
    var src = state && state.days && state.days[dayISO];
    var out = emptyDay();
    if (src) for (var i = 0; i < PILLARS.length; i++) out[PILLARS[i]] = !!src[PILLARS[i]];
    return out;
  }

  function setPillar(state, dayISO, pillar, value) {
    if (PILLARS.indexOf(pillar) < 0) return state;
    var next = { startDate: (state && state.startDate) || dayISO, days: {} };
    if (state && state.days) {
      for (var k in state.days) {
        if (Object.prototype.hasOwnProperty.call(state.days, k)) {
          next.days[k] = {};
          for (var p in state.days[k]) {
            if (Object.prototype.hasOwnProperty.call(state.days[k], p)) next.days[k][p] = state.days[k][p];
          }
        }
      }
    }
    if (!next.days[dayISO]) next.days[dayISO] = emptyDay();
    next.days[dayISO][pillar] = (value === undefined) ? true : !!value;
    return next;
  }

  function dayCount(day) {
    if (!day) return 0;
    var n = 0;
    for (var i = 0; i < PILLARS.length; i++) if (day[PILLARS[i]]) n++;
    return n;
  }

  function dayComplete(day) { return dayCount(day) === PILLARS.length; }

  function xpForDay(day) {
    var c = dayCount(day);
    return c * XP_PER_PILLAR + (c === PILLARS.length ? FULL_DAY_BONUS : 0);
  }

  function totalXp(state) {
    var sum = 0, days = (state && state.days) || {};
    for (var k in days) if (Object.prototype.hasOwnProperty.call(days, k)) sum += xpForDay(days[k]);
    return sum;
  }

  function daysCompleted(state) {
    var n = 0, days = (state && state.days) || {};
    for (var k in days) if (Object.prototype.hasOwnProperty.call(days, k) && dayComplete(days[k])) n++;
    return n;
  }

  function progress(state) {
    var done = daysCompleted(state);
    var capped = done > TARGET_DAYS ? TARGET_DAYS : done;
    return { done: capped, total: TARGET_DAYS, pct: Math.round(capped / TARGET_DAYS * 100) };
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

  function streak(state, todayISO) {
    var days = (state && state.days) || {};
    function isFull(iso) { return dayComplete(days[iso]); }
    var cursor = todayISO;
    if (!isFull(cursor)) {
      var y = addDays(todayISO, -1);
      if (!isFull(y)) return 0;
      cursor = y;
    }
    var s = 0;
    while (isFull(cursor)) { s++; cursor = addDays(cursor, -1); }
    return s;
  }

  function ringsForToday(state, todayISO) { return dayPillars(state, todayISO); }

  function badgesUnlocked(state) {
    var done = daysCompleted(state);
    var out = [];
    for (var i = 0; i < MILESTONES.length; i++) if (done >= MILESTONES[i]) out.push(MILESTONES[i]);
    if (totalXp(state) >= XP_BADGE) out.push("xp");
    return out;
  }

  return {
    PILLARS: PILLARS, XP_PER_PILLAR: XP_PER_PILLAR, FULL_DAY_BONUS: FULL_DAY_BONUS,
    TARGET_DAYS: TARGET_DAYS, MILESTONES: MILESTONES, XP_BADGE: XP_BADGE,
    emptyDay: emptyDay, dayPillars: dayPillars, setPillar: setPillar,
    dayCount: dayCount, dayComplete: dayComplete, xpForDay: xpForDay, totalXp: totalXp,
    daysCompleted: daysCompleted, progress: progress, addDays: addDays,
    streak: streak, ringsForToday: ringsForToday, badgesUnlocked: badgesUnlocked
  };
});
