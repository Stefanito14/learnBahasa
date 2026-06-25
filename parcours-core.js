(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.ParcoursCore = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isLessonDone(doneMap, id) {
    return !!doneMap && doneMap[id] === "done";
  }

  function nextLessonId(orderedIds, doneMap) {
    for (var i = 0; i < orderedIds.length; i++) {
      if (!isLessonDone(doneMap, orderedIds[i])) return orderedIds[i];
    }
    return null;
  }

  function lessonsProgress(orderedIds, doneMap) {
    var total = orderedIds.length, done = 0;
    for (var i = 0; i < orderedIds.length; i++) {
      if (isLessonDone(doneMap, orderedIds[i])) done++;
    }
    return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
  }

  return { isLessonDone: isLessonDone, nextLessonId: nextLessonId, lessonsProgress: lessonsProgress };
});
