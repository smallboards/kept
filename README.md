# Kept

A personal tracker you publish as a Claude Artifact. Three tabs, one shared
database, no server and no build step — it is a single HTML file.

Every board asks the same question in a different tense: **does this end up
kept?** Sale Watch is something you might keep. Doorstep is the window you have
to decide. The closet is what you did keep.

- **Sale Watch** — things you want but haven't bought, and whether a "sale" is real
- **Doorstep** — what's in transit, and how long you have left to return it
- **Cher's Closet** — things you own, assembled into outfits

It ships **empty**. Nothing is hardcoded, and no one else's data is in it —
there is a check in `scripts/check-page.js` that fails the build if any ever
creeps in.

**Why it exists.** Shopping research is the part Claude is genuinely good at
and the part that evaporates the moment the conversation ends. These boards are
somewhere for it to land: prices with history behind them, return windows with
a clock on them, and a wardrobe that knows a parka and a pair of sandals do not
go together.

---

## 1. Publish it

You need Claude Code and a claude.ai account. From this folder, say:

> Publish `kept.html` as an artifact. Declare capabilities
> `{"db": {}, "user": {}, "downloads": true}`.

Claude will hand you back a URL. That's your board — your own copy, your own
database. Bookmark it.

**Why those three capabilities:**

| | |
|---|---|
| `db` | where your items, packages and garments are stored |
| `user` | identifies you, so the data is yours |
| `downloads` | the CSV export button (it hides itself without this) |

If you skip `db`, the page still renders but nothing saves — and it tells you so
rather than failing quietly.

## 2. Put something in it

Two ways, and they work together.

**By hand.** Every tab has an add button. Fastest for one-offs.

**Through Claude.** This is the better path and the reason the thing exists.
After Claude researches something for you, ask it to write the rows directly:

> Add these to my Kept sale watch — write them to the `items`
> collection with `write_db` at <your artifact URL>.

Claude writes straight to the database. No republishing, no copy-paste.

---

## What you need connected

**To run the page: nothing.** It's a single artifact. `db`, `user` and
`downloads` are artifact capabilities, not connectors — they're granted when
you publish with the line above, and they need no setup on your side beyond
being signed in to claude.ai.

**To get the good version of this, you want two more things.** The page is
only half the tool; the other half is Claude filling it in for you.

| Want | Needs |
|---|---|
| Claude checks prices and adds items for you | **Claude in Chrome** (browser extension) |
| Doorstep fills itself from your order emails | **Gmail connector** |
| Claude writes rows directly into the board | nothing extra — `write_db` with your artifact URL |

**Claude in Chrome** — install from claude.ai/chrome, sign in with the same
account. Then you can say *"check the price on everything in my sale watch and
update it"* and it will actually go and look, rather than asking you to.

**Gmail connector** — turn it on in claude.ai settings under Connectors. Then
*"go through my shipping emails and add anything that isn't already on
Doorstep"* works, which is the thing that makes the return clock worth having.
Without it you'd be typing in tracking numbers by hand, and you won't.

Neither is required. The page works without both — you just do more typing.

---

## 3. The data

Three collections. Flat shapes, no nesting beyond `history`.

### `items/{id}` — Sale Watch

```json
{
  "name": "Brand — Item",
  "url": "https://…",
  "image": "https://…",
  "category": "Coats",
  "price": 148.00,
  "firstPrice": 198.00,
  "target": 120.00,
  "note": "Size L. What it replaces, why you want it.",
  "history": [
    { "date": "2026-11-01", "price": 198.00 },
    { "date": "2026-11-19", "price": 148.00 }
  ]
}
```

**`history` is the field that matters.** Append a `{date, price}` every time you
check a price. Don't just overwrite `price` — the sparkline and the price-hike
detector both read the history, and overwriting blinds them.

**About that detector.** It's the one piece of judgement the board makes.
Retailers often *raise* a price shortly before a sale so the discount looks
bigger. If your recorded history shows a rise in the last 60 days, the card
flags it and tells you to measure any discount against the older number. It
only works if you've been recording. Two readings is enough to start.

The **Check price** button on each card is the quick way to add a reading.

### `packages/{id}` — Doorstep

```json
{
  "item": "What's coming",
  "retailer": "Shop name",
  "status": "shipped",
  "ordered": "2026-11-14",
  "eta": "2026-11-22",
  "delivered": null,
  "carrier": "USPS",
  "tracking": "…",
  "returnDays": 30,
  "returnFrom": "delivered",
  "note": ""
}
```

- `status` — `ordered` | `shipped` | `delivered`
- `returnFrom` — `delivered` or `ordered`

**Get `returnFrom` right.** Retailers genuinely differ on when the clock starts,
and assuming wrong is exactly how a return window gets missed. The card counts
down and turns amber with 7 days left.

Dates are plain `YYYY-MM-DD` strings.

### `closet/{id}` — Cher's Closet

```json
{
  "name": "Black wool coat",
  "slot": "LAYER",
  "color": "#1d2228",
  "warmth": ["freezing", "cold"],
  "days": ["office", "travel"],
  "note": "Hits below the hip"
}
```

`slot` is one of `LAYER` · `TOP` · `BTM` · `SHOE` · `ACC`.

Only put in things you **actually own**. The board's job is showing what you can
assemble this morning, not what you could buy. `color` is a hex swatch — it's
what the figure preview draws, so approximate is fine.

**`warmth` and `days` are both optional, and both matter.** See
[docs/CLOSET.md](docs/CLOSET.md) for what they do and why leaving them off is a
real choice rather than laziness.

---

## 4. The one rule the closet enforces

Set the weather and what kind of day it is, and garments that do not suit get
dimmed — never hidden, because it is still your coat and you can still pick it.

More usefully: **everything you are wearing has to agree with everything else.**
Pick a down parka and a pair of summer slides and the board says so, by name,
instead of presenting it as an outfit. It checks two axes — temperature and
what kind of day — because the second one is the only thing that catches
dinner-only earrings turning up on a site visit.

An untagged garment is eligible for everything. That is deliberate: absent tags
must never hide something you own. Tag the pieces where it genuinely matters —
coats, shoes, hats — and leave the t-shirts alone.

**Pick for me** commits to one temperature and one kind of day *first*, then
fills each slot within it. Rolling every slot independently is exactly what put
the parka with the sandals in the first place.

## 5. Using it

- Tap a garment to wear it; tap again to take it off.
- **Pick for me** fills every slot. Good when you can't decide.
- **Start over** clears the outfit and the conditions together.
- The tab you were last on is the one that opens next time.
- Light and dark both work — it follows your system theme.

## 6. Changing it

It's one HTML file with no build step and no dependencies beyond Google Fonts.
Open it, edit it, ask Claude to republish to the same URL.

Things people usually change first:

- **`SLOTS`** near the top of the script — rename or add wardrobe slots
- **`BANDS`** and **`DAYKEYS`** — the two condition axes, if yours differ
- **`--accent`** in the `:root` block — the one colour the design hangs on
- **`priceHike()`** — the 60-day window for what counts as "recent"

### Before you republish

```sh
node scripts/check-page.js              # structure, syntax, no personal data
node scripts/check-page.js --self-test  # proves the leak detector actually fires
node scripts/test-closet.js             # the outfit rules, 16 assertions
```

`check-page.js` is the whole CI. It parses every inline script (a syntax error
there kills a tab silently in the browser), confirms all three tabs are present,
checks for the handful of features that have been accidentally reverted before,
and scans **every tracked file** — not just the HTML — for anything shaped like
personal data: an email address, a published artifact URL, a street address, a
phone number, an opaque calendar id.

Names and places cannot be pattern-matched, so they go one per line in
`.leakwords`, which is gitignored. A detector that hardcodes the names it hunts
for publishes them — which is the exact bug it exists to prevent.

`--self-test` plants one of each shape and asserts it is caught. A leak detector
nobody has watched fire is a decoration.

`test-closet.js` runs the real rules straight out of the HTML — not a copy, so
it cannot drift away from the thing it is testing.

## Troubleshooting

**Nothing saves.** You're signed out, or the page was published without `db`.
The banner at the top of each tab tells you which.

**The CSV button is missing.** It hides itself when `downloads` wasn't declared.
Republish with it.

**Claude can't write rows.** It needs your artifact URL, and you need to be the
owner or an editor on it.
