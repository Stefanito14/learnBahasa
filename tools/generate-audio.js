"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const AudioCore = require("../audio-core.js");
const DATA = require("../data.js");
const { collectStrings } = require("./audio-strings.js");

const ROOT = path.resolve(__dirname, "..");
const AUDIO_DIR = path.join(ROOT, "audio");
const HTML = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const VOICES = { f: "id-ID-GadisNeural", m: "id-ID-ArdiNeural" };
const RATE = "-8%";

// args: --limit N, --dry-run
const argv = process.argv.slice(2);
const limitIdx = argv.indexOf("--limit");
let LIMIT = Infinity;
if (limitIdx >= 0) {
  LIMIT = parseInt(argv[limitIdx + 1], 10);
  if (!Number.isFinite(LIMIT) || LIMIT <= 0) {
    console.error("--limit requiert un entier positif");
    process.exit(1);
  }
}
const DRY = argv.includes("--dry-run");

function synthesize(text, voiceName, outPath) {
  // Délègue au CLI edge-tts. Args en tableau → pas de souci de quoting.
  execFileSync("python", [
    "-m", "edge_tts",
    "--voice", voiceName,
    "--rate=" + RATE,
    "--text", text,
    "--write-media", outPath
  ], { stdio: "ignore" });
}

function main() {
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  let strings = collectStrings(DATA, HTML);
  if (Number.isFinite(LIMIT)) strings = strings.slice(0, LIMIT);

  console.log(strings.length + " chaînes à traiter (×2 voix). dry-run=" + DRY);

  let made = 0, skipped = 0, failed = 0;
  for (const text of strings) {
    const hash = AudioCore.fnv1a(text);
    for (const v of Object.keys(VOICES)) {
      const out = path.join(AUDIO_DIR, hash + "-" + v + ".mp3");
      if (fs.existsSync(out)) { skipped++; continue; }
      if (DRY) { console.log("WOULD: " + path.basename(out) + "  <= " + text); made++; continue; }
      try {
        synthesize(text, VOICES[v], out);
        made++;
      } catch (e) {
        console.error("ÉCHEC synth: [" + text + "] (" + v + ") — " + e.message);
        failed++;
      }
    }
  }

  // Index = hashs dont LES DEUX voix existent sur disque (reflète le disque, pas juste ce run)
  if (!DRY) writeIndex();
  console.log("Terminé. générés=" + made + " ignorés(déjà là)=" + skipped + " échecs=" + failed);
  if (failed > 0) process.exitCode = 1;
}

function writeIndex() {
  const files = fs.readdirSync(AUDIO_DIR);
  const hasF = new Set(), hasM = new Set();
  for (const f of files) {
    let m;
    if ((m = f.match(/^([0-9a-f]{8})-f\.mp3$/))) hasF.add(m[1]);
    else if ((m = f.match(/^([0-9a-f]{8})-m\.mp3$/))) hasM.add(m[1]);
  }
  const hashes = [...hasF].filter((h) => hasM.has(h)).sort();
  const body =
    "(function (root, factory) {\n" +
    "  var mod = factory();\n" +
    "  if (typeof module !== 'undefined' && module.exports) module.exports = mod;\n" +
    "  else root.AUDIO_INDEX = mod;\n" +
    "})(typeof self !== 'undefined' ? self : this, function () {\n" +
    "  return " + JSON.stringify(hashes) + ";\n" +
    "});\n";
  fs.writeFileSync(path.join(ROOT, "audio-index.js"), body, "utf8");
  console.log("audio-index.js écrit : " + hashes.length + " entrées.");
}

main();
