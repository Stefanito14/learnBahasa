(function (root, factory) {
  "use strict";
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  else root.AudioCore = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function normalize(s) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  }

  function fnv1a(s) {
    var str = normalize(s);
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  }

  function audioFilename(text, voice) {
    return "audio/" + fnv1a(text) + "-" + voice + ".mp3";
  }

  function resolveAudio(text, voice, index) {
    var h = fnv1a(text);
    var has = index && (typeof index.has === "function"
      ? index.has(h)
      : index.indexOf(h) >= 0);
    if (has) return { type: "file", src: "audio/" + h + "-" + voice + ".mp3", hash: h };
    return { type: "tts" };
  }

  function voiceForRole(roleIndex, voicePref) {
    var other = voicePref === "f" ? "m" : "f";
    return (roleIndex % 2 === 0) ? voicePref : other;
  }

  return {
    normalize: normalize,
    fnv1a: fnv1a,
    audioFilename: audioFilename,
    resolveAudio: resolveAudio,
    voiceForRole: voiceForRole
  };
});
