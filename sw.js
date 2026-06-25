/* Service worker — Bahasa Indonesia PWA */
"use strict";
var CACHE = "bahasa-v2";
var SHELL = [
  "./",
  "./index.html",
  "./audio-core.js",
  "./data.js",
  "./audio-index.js",
  "./srs-core.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        try {
          var url = new URL(req.url);
          var cacheable = res && res.status === 200 &&
            (url.origin === self.location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.host));
          if (cacheable) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
        } catch (err) { /* ignore */ }
        return res;
      }).catch(function () {
        return caches.match("./index.html");
      });
    })
  );
});
