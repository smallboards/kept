#!/usr/bin/env node
// The outfit rules are the only non-obvious logic in the page, so they get the
// one test. It runs the real code out of the HTML rather than a copy of it —
// a copy would pass forever after the page changed.
const fs = require("fs"), vm = require("vm"), assert = require("assert");

const page = fs.readFileSync(require("path").join(__dirname, "..", "kept.html"), "utf8");
const from = page.indexOf("const BANDS = ");
const to = page.indexOf("function describeCond()");
assert.ok(from > -1 && to > from, "could not find the conditions block in kept.html");

// `const` in a vm script stays in script scope rather than landing on the
// context, so the block hands its own bindings back on the last expression.
const ctx = { localStorage: { getItem: () => null, setItem() {} }, console };
vm.createContext(ctx);
const api = vm.runInContext(page.slice(from, to) + "\n;({ tags, suits, clash, shared, AXES, cond });", ctx);
const { tags, suits, clash, shared, AXES, cond } = api;

const parka  = { name: "Parka",   warmth: ["freezing", "cold"] };
const sandal = { name: "Sandal",  warmth: ["warm"] };
const jeans  = { name: "Jeans",   warmth: ["cold", "mild", "warm"] };
const studs  = { name: "Studs",   days: ["dinner"] };
const boots  = { name: "Boots",   days: ["site", "office"] };
const plain  = { name: "Plain" };

// An untagged garment is eligible for everything. This is the rule that must
// never regress: absent tags cannot hide something you own.
assert.deepStrictEqual([...tags(plain, AXES[0])], [...AXES[0].all]);
assert.strictEqual(clash([plain, parka, sandal]) !== null, true, "untagged piece must not rescue a real clash");
assert.strictEqual(clash([plain, jeans]), null);

// The reported bug: a down coat and a summer slide share no temperature.
const hit = clash([parka, sandal]);
assert.ok(hit, "parka + sandal must clash");
assert.strictEqual(hit.ax.key, "warmth");
assert.deepStrictEqual([hit.a.name, hit.b.name].sort(), ["Parka", "Sandal"]);

// Jeans overlap both, so each pair on its own is fine...
assert.strictEqual(clash([parka, jeans]), null);
assert.strictEqual(clash([jeans, sandal]), null);
// ...but all three together still have no common band.
assert.ok(clash([parka, jeans, sandal]), "three-way clash must be caught");

// Second axis: jewelry carries no warmth at all, so only `days` can catch it.
const formal = clash([studs, boots]);
assert.ok(formal, "dinner-only studs + site boots must clash");
assert.strictEqual(formal.ax.key, "days", "should be caught on the day axis, not weather");

// Fewer than two pieces is never a clash.
assert.strictEqual(clash([]), null);
assert.strictEqual(clash([parka]), null);

// suits() reads the live `cond`, which starts empty: everything is in play.
assert.strictEqual(suits(sandal), true);
cond.temp = "freezing";
assert.strictEqual(suits(sandal), false);
assert.strictEqual(suits(parka), true);
assert.strictEqual(suits(plain), true, "untagged stays eligible under any condition");
cond.temp = null;

// An empty intersection is what "clash" means; a non-empty one is not.
assert.deepStrictEqual([...shared([parka, jeans], AXES[0])], ["cold"]);
assert.deepStrictEqual([...shared([parka, sandal], AXES[0])], []);

console.log("closet rules OK — 16 assertions");
