#!/usr/bin/env node
// The outfit rules are the only non-obvious logic in the page, so they get the
// one test. It runs the real code out of the HTML rather than a copy of it —
// a copy would pass forever after the page changed.
const fs = require("fs"), vm = require("vm"), assert = require("assert");

const page = fs.readFileSync(require("path").join(__dirname, "..", "kept.html"), "utf8");
const from = page.indexOf("const BANDS = ");
const to = page.indexOf("const $  = (s, r = document)");
assert.ok(from > -1 && to > from, "could not find the conditions block in kept.html");

// `const` in a vm script stays in script scope rather than landing on the
// context, so the block hands its own bindings back on the last expression.
const ctx = { localStorage: { getItem: () => null, setItem() {} }, console };
vm.createContext(ctx);
const api = vm.runInContext(page.slice(from, to) +
  "\n;({ tags, suits, clash, shared, AXES, cond, REST, restDays, restLeft, rested, worn, days });", ctx);
const { tags, suits, clash, shared, AXES, cond, REST, restDays, restLeft, rested, worn, days } = api;

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

// --- resting -----------------------------------------------------------------
// The wear log is the other half of dressing yourself: without it the same four
// things come back every day. These are the rules that must not regress.
const DAY = (n) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);
const tee  = { id: "tee",  slot: "TOP",  name: "Tee" };
const shoe = { id: "shoe", slot: "SHOE", name: "Boots" };
const denim= { id: "den",  slot: "BTM",  name: "Jeans", rest: 0 };
const legs = { id: "legs", slot: "BTM",  name: "Leggings", copies: 3 };

// Slot defaults, and a garment's own number beating them.
assert.strictEqual(restDays(tee), REST.TOP);
assert.strictEqual(restDays(shoe), 0, "shoes are meant to repeat");
assert.strictEqual(restDays(denim), 0, "an explicit 0 must beat the slot default");
assert.strictEqual(restDays({ slot: "NOPE" }), 0, "an unknown slot must not throw");

// Nothing worn yet: everything is free.
assert.strictEqual(rested(tee, DAY(10)), true);

// Worn today, and a 6-day tee owes 6 days.
worn[DAY(10)] = ["tee", "shoe", "den"];
assert.strictEqual(restLeft(tee, DAY(10)), REST.TOP);
assert.strictEqual(restLeft(tee, DAY(13)), REST.TOP - 3);
assert.strictEqual(restLeft(tee, DAY(16)), 0, "the window has to actually expire");
assert.strictEqual(rested(shoe, DAY(10)), true, "a 0 never rests");
assert.strictEqual(rested(denim, DAY(10)), true, "denim goes straight back on");

// Duplicates: three pairs is three wears before the first is back.
worn[DAY(20)] = ["legs"]; worn[DAY(21)] = ["legs"];
assert.strictEqual(rested(legs, DAY(21)), true, "two wears of three copies is still free");
worn[DAY(22)] = ["legs"];
assert.strictEqual(rested(legs, DAY(22)), false, "the third wear uses the last copy");
// Day 22 used the third copy, so it owes a day. By day 23 the day-20 wear has
// aged out of a 3-day window and a copy is free again - the window slides, it
// does not reset.
assert.strictEqual(restLeft(legs, DAY(22)), 1);
assert.strictEqual(restLeft(legs, DAY(23)), 0, "the oldest wear ages out and frees a copy");
assert.strictEqual(rested(legs, DAY(23)), true);

// A wear outside the window must not count against the copies.
assert.strictEqual(rested({ id: "legs", slot: "BTM", copies: 1 }, DAY(40)), true);

console.log("closet rules OK — 32 assertions");
