# The closet rules

Two fields do all the work, and both are optional.

```json
{ "warmth": ["freezing", "cold"], "days": ["office", "travel"] }
```

| field | values |
|---|---|
| `warmth` | `freezing` · `cold` · `mild` · `warm` |
| `days` | `office` · `site` · `dinner` · `travel` · `home` |

## Absent means "anything"

A garment with no `warmth` is warm enough for any weather. A garment with no
`days` is right for any day. This is the rule the whole thing rests on, and it
is the one most likely to get broken by someone trying to be helpful:

> **Absent tags must never hide something you own.**

The alternative — treating a missing tag as "unknown, so exclude it" — means a
closet reports "nothing suits" the moment you add a piece in a hurry. A tool
that punishes you for not finishing data entry does not get used.

So tag the pieces where it genuinely decides something: coats, shoes, hats,
swimwear, jewellery you would not wear to a warehouse. Leave the t-shirts alone.

## Dimming, not filtering

Setting conditions dims what does not suit. It never removes it. You can still
pick a dimmed garment — you know something the board does not, and most of the
time you are right.

## The clash rule

Every slot is filtered against the day *on its own*. That is fine until you
realise nothing was ever comparing your picks to **each other**, which is how a
down parka ends up beside a platform sandal with no complaint.

The fix is one rule: everything in the outfit has to share at least one value on
each axis.

```
parka  warmth = [freezing, cold]
sandal warmth = [warm]
              ∩ = []            → clash
```

When the intersection is empty the board names the two garments furthest apart
and says which axis they disagree on, because "something is wrong" is not
actionable and "these two, on temperature" is.

### Why two axes and not one

Jewellery carries no `warmth` at all — an earring is not warmer or cooler than
another earring. So the temperature axis can never catch dinner-only studs
turning up on a site-visit day. `days` is what catches it.

A third axis would be one more entry in the `AXES` table at the top of the
script. Formality is the obvious candidate if `days` turns out too coarse.

### What it does not check

Colour. Pattern. Whether the proportions work. Those need taste, and taste does
not survive being written down as an array.

## Pick for me

It commits to one temperature and one kind of day first, then fills each slot
within that. If a slot has nothing that fits, it falls back to the whole slot
rather than leaving you half dressed — and the clash warning then explains why
the result looks odd.

## Resting

A closet that only answers "what goes together" still puts the same four things
on you every week. The wear log is the other half.

Press **I wore this** and the outfit currently on is recorded against today.
After that, anything still resting is dimmed on its rack with the days it owes,
and **Pick for me** reaches past it.

How long a thing rests comes from its slot:

| slot | days | why |
|---|---|---|
| `TOP` | 6 | worn against skin, but wool is not done after a day |
| `BTM` | 3 | the knit bottoms; set `rest` to 0 for denim |
| `LAYER` | 2 | a cardigan is not dirty after one wear |
| `SHOE` | 0 | shoes are meant to repeat |
| `ACC` | 0 | so are earrings |

Two per-garment fields override it:

- **`rest`** — days off for this garment specifically. `0` means it goes straight
  back on, which is the right answer for denim: washing jeans every wear is how
  they die.
- **`copies`** — how many identical ones you own. Three pairs of the same
  leggings is three wears before the first is back from the wash, so the count
  lives here rather than as three cards on the rack.

Resting is a preference, not a veto. If everything in a slot is resting,
**Pick for me** still picks — one clean shirt beats no shirt.

Nothing leaves the browser: the log is a `kept-worn` key in `localStorage`,
keyed by date.
