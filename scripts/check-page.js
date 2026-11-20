#!/usr/bin/env node
// The page is a single file with no build step, so this is the whole CI.
const fs = require("fs"), vm = require("vm"), path = require("path");

const file = path.join(__dirname, "..", "kept.html");
const page = fs.readFileSync(file, "utf8");
let bad = 0;
const fail = (m) => { console.error("FAIL " + m); bad++; };

["sale", "door", "clos"].forEach((n) => {
  if (!page.includes(`id="pane-${n}"`)) fail(`tab pane-${n} missing`);
  if (!page.includes(`id="tab-${n}"`)) fail(`tab button tab-${n} missing`);
});

// A syntax error in an inline script kills the whole page silently in a browser.
const blocks = page.match(/<script>[\s\S]*?<\/script>/g) || [];
if (!blocks.length) fail("no script block found");
blocks.forEach((b, i) => {
  try { new vm.Script(b.slice(8, -9)); }
  catch (e) { fail(`script block ${i} does not parse: ${e.message}`); }
});

const MUST = {
  "conditions pills": 'id="cond-temps"',
  "outfit coherence rule": "function clash(",
  "untagged-matches-everything rule": "ax.all",
  "price-hike detector": "function priceHike",
  "db-backed store": 'window.claude?.use?.("db")',
};
Object.entries(MUST).forEach(([what, needle]) => {
  if (!page.includes(needle)) fail(`${what} is not in the page (looked for ${needle})`);
});

// Nothing personal should ever ship. These shapes are generic on purpose — a
// detector that hardcodes the names it is looking for publishes them, which is
// exactly the bug it exists to prevent.
const SHAPES = {
  "an email address": /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  "a published artifact URL": /claude\.ai\/(artifact|code)\//i,
  "a street address": /\b\d{1,5}\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Rd|Road|Ln|Lane|Dr|Drive|Blvd)\b/,
  "a US phone number": /\(\d{3}\)\s?\d{3}-\d{4}|\b\d{3}-\d{3}-\d{4}\b/,
  "a long opaque id": /\b[A-Za-z0-9_-]{22,}@(group|import)\.calendar\b/,
};
// Names and places can't be pattern-matched, so they live in an untracked file,
// one per line. No file, no check — it is a local safety net, not a gate.
let words = [];
try {
  words = fs.readFileSync(path.join(__dirname, "..", ".leakwords"), "utf8")
    .split("\n").map((w) => w.trim()).filter((w) => w && !w.startsWith("#"));
} catch (e) {}

// One scanner, used for real files and for the self-test, so what is proven to
// work is the same code that runs.
function scanText(rel, text, report) {
  for (const [what, re] of Object.entries(SHAPES)) {
    const m = text.match(re);
    if (m) report(`${rel} contains ${what}: ${JSON.stringify(m[0])}`);
  }
  for (const w of words) {
    const i = text.toLowerCase().indexOf(w.toLowerCase());   // case-insensitive on BOTH sides
    if (i > -1) report(`${rel} contains a private word from .leakwords: ${JSON.stringify(text.slice(i, i + w.length))}`);
  }
}

// A detector nobody has watched fire is a decoration. Plant one of each shape
// and assert it is caught: `node scripts/check-page.js --self-test`.
if (process.argv.includes("--self-test")) {
  const CASES = [
    ["an email address", "write to someone@example.com please"],
    ["a published artifact URL", "see https://claude.ai/artifact/Ab3xYz for the board"],
    ["a street address", "they live at 1124 Example St now"],
    ["a US phone number", "call (713) 353-2582 first"],
    ["a long opaque id", "cal abcdefghijklmnopqrstuvwxyz012345@import.calendar.google.com"],
  ];
  let missed = 0;
  for (const [what, sample] of CASES) {
    let caught = false;
    scanText("<self-test>", sample, (msg) => { if (msg.includes(what)) caught = true; });
    console.log(`${caught ? "caught" : "MISSED"}  ${what}`);
    if (!caught) missed++;
  }
  // And the word list, which is the half that cannot be pattern-matched.
  if (words.length) {
    let caught = false;
    scanText("<self-test>", `the ${words[0].toUpperCase()} case`, (m) => { if (m.includes(".leakwords")) caught = true; });
    console.log(`${caught ? "caught" : "MISSED"}  a .leakwords word in the wrong case`);
    if (!caught) missed++;
  } else {
    console.log("skipped  .leakwords (no file present)");
  }
  console.log(missed ? `${missed} shape(s) NOT caught` : "self-test OK");
  process.exit(missed ? 1 : 0);
}

// Everything that ships, not just the page — a LICENSE leaks as readily as HTML.
const shipped = require("child_process")
  .execSync("git ls-files", { cwd: path.join(__dirname, "..") })
  .toString().split("\n").filter(Boolean);
shipped.forEach((rel) => {
  let text;
  try { text = fs.readFileSync(path.join(__dirname, "..", rel), "utf8"); } catch (e) { return; }
  if (rel === "scripts/check-page.js") return; // the detector describes the shapes it hunts
  scanText(rel, text, fail);
});

console.log(`${blocks.length} script block${blocks.length === 1 ? "" : "s"} · ${(page.length / 1024).toFixed(0)} KB · 3 tabs`);
console.log(bad ? `${bad} problem${bad === 1 ? "" : "s"}` : "OK");
process.exit(bad ? 1 : 0);
