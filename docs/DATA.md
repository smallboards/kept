# Data reference

Three collections in the artifact's `db`. Flat shapes, no nesting beyond
`history`. Dates are plain `YYYY-MM-DD` strings throughout.

## `items/{id}` — Sale Watch

| field | type | notes |
|---|---|---|
| `name` | string | required |
| `url` | string | the product page |
| `image` | string | an absolute `https://` URL, or omit it |
| `category` | string | free text; drives the filter chips |
| `price` | number | what it costs today |
| `firstPrice` | number | what it cost when you started watching |
| `target` | number | what you would pay |
| `history` | array | `{date, price}`, **appended to, never overwritten** |
| `note` | string | size, what it replaces, why you want it |

**`history` is load-bearing.** The sparkline and the price-hike detector both
read it. Overwriting `price` without appending a reading blinds both of them,
and the detector is the only piece of judgement on the page: it flags a price
that went *up* in the last 60 days, because a discount measured against an
inflated number is smaller than it looks.

## `packages/{id}` — Doorstep

| field | type | notes |
|---|---|---|
| `item` | string | required |
| `retailer` | string | |
| `status` | string | `ordered` · `shipped` · `delivered` |
| `ordered` `shipped` `eta` `delivered` | date | |
| `carrier` `tracking` | string | |
| `returnDays` | number | length of the window |
| `returnFrom` | string | `delivered` or `ordered` |
| `note` | string | |

**Get `returnFrom` right.** Retailers genuinely differ on when the clock starts,
and assuming wrong is exactly how a return window gets missed. The card counts
down and turns amber with seven days left.

## `closet/{id}` — Cher's Closet

| field | type | notes |
|---|---|---|
| `name` | string | required |
| `slot` | string | `LAYER` · `TOP` · `BTM` · `SHOE` · `ACC` |
| `color` | string | hex swatch for the figure preview |
| `warmth` | array | optional — see [CLOSET.md](CLOSET.md) |
| `days` | array | optional — see [CLOSET.md](CLOSET.md) |
| `note` | string | |

Only things you **actually own**. The board's job is showing what you can
assemble this morning, not what you could buy.

## Letting Claude write rows

Point it at the artifact and name the collection:

> Add these to the `items` collection at `<your artifact URL>` with `write_db`.

It writes straight to the database — no republishing, no copy-paste. Use a
batch when there is more than a couple.
