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
