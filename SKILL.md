---
name: find-hotel
description: >
  This skill should be used when the user asks to "find a hotel", "book a
  hotel", "search hotels", "find a room", "find somewhere to stay" near an
  airport or in a city, or to book accommodation alongside a flight or train.
  It starts from the user's favourite hotels, sweeps Booking.com for
  better-rated alternatives, grades room design and desk from photos, reads
  reviews, cross-checks the direct site, and drives a reservation up to the
  payment step. Default to hotels; for Airbnb / short-term rentals use
  find-airbnb.
---

# Find hotel

Find the best hotel for the user's dates (best-rated, best-designed and best
value) and drive the reservation up to, never through, payment.

The user's own preferences live in two files in this skill's `data/` folder:

- `data/preferences.md`: booking accounts, loyalty programmes, rate rules,
  score bar, must-haves, room taste, price guidance, area rules and where to
  record bookings.
- `data/favourites.json`: hotels the user likes, by city, with their verdicts.

Where this file and `data/preferences.md` differ, the preferences file wins.

## What this skill must never do

These are hard limits, regardless of how the task is phrased:

- **Never enter payment/card details, and never complete a purchase.** Drive
  the booking up to the reservation/payment step, then hand off to the user to
  enter card details and confirm.
- **Never create an account or sign in with a password.** If a site is logged
  out, hand off rather than authenticating.
- **Never click the final irreversible "Reserve" / "Book now" / "Confirm"
  control without explicit confirmation** for that specific booking (hotel,
  dates, rate, price).

## Workflow

### Step 0: Model check

Check which model is running (stated in the system prompt's environment
block). If it is a Mythos-class model (Fable), pause before searching and tell
the user this task does not need that tier. Offer:

1. Continue on the current model.
2. Delegate the whole workflow to a subagent on a cheaper model (Agent tool
   with `model: "sonnet"`; subagents share the session's browser tools).
3. They relaunch the session on a cheaper model (`/model`).

Wait for their choice. On Opus, Sonnet, or Haiku, skip this step and proceed.

### Step 1: Load preferences (first run: set them up)

Read `data/preferences.md` and `data/favourites.json`.

If `data/preferences.md` does not exist, this is the first run. Tell the user
the skill works best with their preferences, then set them up:

1. Copy `examples/preferences.md` to `data/preferences.md`, and create
   `data/favourites.json` as `{}`. `examples/favourites.json` shows the
   entry format.
2. Ask, in one message: which booking sites they are signed in to and which
   loyalty programmes they hold; non-refundable or flexible by default; their
   minimum review score; must-have amenities; how they get around cities
   (walk, cycle, public transport); and two or three hotels they have loved,
   as links.
3. Open the photo galleries of the hotels they named and write the room-taste
   section from what those hotels share. Add them to `data/favourites.json`.
4. Replace the example content in `data/preferences.md` with their answers and
   show them the result.

If they would rather skip setup, search with the example file's defaults and
say so in the report.

### Step 2: Confirm the brief

Confirm destination (airport vs city), check-in and check-out dates (derive
nights), guests, and the places the user needs to reach (office, venue,
station). If booking alongside a flight or train, derive check-in from the
arrival date. If the request is clear, proceed without asking.

**Price band.** Use the range the user gives. Otherwise judge it: around, or
a little above, the going rate for a well-rated hotel in that area on those
dates, anchored on what the favourites cost that night (Step 3). State the
band you used in the report.

**Area.** Apply any area rule in the preferences for this city (for example,
"anywhere within 20 minutes' cycle in central London"). Otherwise use a
walking radius around the targets: in-terminal or walking distance for an
airport stopover, central for a city stay. If the area is ambiguous, ask.

### Step 3: Price the favourites

Look up the city in `data/favourites.json`. Open each favourite's Booking.com
page with the dates and capture its cheapest suitable room and rates. These
are the benchmark: the sweep has to find hotels that match or beat them.

If the city has no favourites, ask the user whether they have any there, and
add the ones they name.

The step is done when every favourite in the city has a price for the dates,
or is marked unavailable.

### Step 4: Sweep Booking.com

Search with the filters on:

```text
https://www.booking.com/searchresults.en-gb.html?ss=AREA&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&group_adults=1&no_rooms=1&group_children=0&nflt=ht_id%3D204%3Breview_score%3D80%3Boos%3D1%3Bprice%3DCUR-MIN-MAX-1&order=bayesian_review_score
```

- `ht_id=204`: hotels only. The filter is leaky, so drop guesthouses,
  aparthotels and serviced apartments by eye unless the preferences allow
  them.
- `review_score=80`: 8.0 or more (`90` for 9.0+).
- `oos=1`: available properties only.
- `price=GBP-150-250-1`: price per night from 150 to 250 (`GBP-min-250-1` for
  no lower bound).
- `order=bayesian_review_score`: "Top reviewed" first, not cheapest first.

Sweep in two passes before shortlisting:

1. **List view, pages 1–3.** Read every result on the first three pages and
   keep those inside the area. The pass is done when page 3 has been read or
   the results run out.
2. **Map view over the whole area.** Open the map with the same filters and
   pan across the area, reading the name, score and price of every pin. The
   pass is done when every pin in the area is on the candidate list or ruled
   out.

**Ranking.** Use the score bands in the preferences (by default: 9.0+ a strong
plus, 8.5–8.9 the normal bar, 8.0–8.4 shown only when much cheaper or a
favourite, and labelled). Booking.com's score from its own verified stays is
the authority. A low Google or Tripadvisor rating is a reason to read those
reviews, never on its own a reason to drop a hotel. Note the Comfort
sub-score.

**Booking.com availability quirk.** The search-results page sometimes wrongly
reports a property as "Unavailable on our site for your selected dates" when
the property page has rooms. Before concluding a property is unavailable, open
its page with the dates in the query string
(`.../hotel/CC/SLUG.en-gb.html?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&group_adults=N&no_rooms=1`).

### Step 5: Assess the shortlist

For every hotel still in contention (aim for six to ten, favourites
included):

1. **Room design.** Open the Booking.com photo gallery and grade the rooms
   against the room-taste section of the preferences and the favourites:
   **A** matches the taste, **B** pleasant but generic, **C** the look the
   user avoids. Grade the room type you would book, not the lobby.
2. **Desk.** From the photos of that room type: a real desk at table height
   with a chair you could work at for hours. A wall shelf, dressing table or
   vanity counter is not a desk. The cheapest room type often lacks one.
3. **Must-haves.** Confirm each must-have from the preferences (for example
   air conditioning) on the property page.
4. **Gym and sauna.** Check the gallery's gym photos for dumbbells, a rack or
   a barbell, and look for a sauna.
5. **Reviews.** Read recent reviews on Booking.com (including the Wi-Fi
   sub-score) and on the hotel's Google Maps listing. Look for deal-breakers
   (noise from the street, nightlife, trains or thin walls; weak Wi-Fi;
   broken air conditioning; building works) and hidden pluses (gym
   equipment, sauna).
6. **Journey times.** Get the time from the hotel to each target with the
   **find-route** skill, in the user's usual mode, never from Booking.com's
   "distance from centre" or an estimate.

The step is done when every shortlisted hotel has a design grade, a desk
verdict, a one-line review note citing what reviews said, and journey times,
and every hotel these checks rule out has been dropped or flagged.

### Step 6: Cross-check the direct site

For the top three, search the hotel's own or chain site for the same room,
dates and guests. Capture the equivalent non-refundable and flexible rates,
converting currency to compare like for like.

**Loyalty programmes.** For a chain where the preferences list a membership,
capture the member rate as well as the public rate and apply the preferences'
rule on where to book. Membership decides where to book a hotel that wins on
its merits; it gives the chain no ranking advantage. Never sign in to obtain a
member rate: if the site is logged out, report the public rates and hand off.

**Hilton-family brands** show the Honors Discount price beside the public
price on hilton.com's "Select a Rate" step, often while signed out: Hilton,
Hampton by Hilton, DoubleTree, Hilton Garden Inn, Curio, Canopy, Waldorf
Astoria, Conrad, Embassy Suites, Tru, Motto, Signia, LXR, Tempo, Home2 Suites
and Homewood Suites.

**Currency.** Pay in the property's local currency and decline any dynamic
currency conversion offer, which carries a poor markup.

### Step 7: Present and decide

Lead with a recommendation, then a table:

| Hotel | Score (Comfort) | Design | Desk | Gym | Non-refundable | Flexible (cancel by) | Journey times | Review note |
|---|---|---|---|---|---|---|---|---|

- Put favourites in the same table, marked, so the user sees how the sweep
  compares.
- Note the price band and area used, and anything ruled out for a reason the
  user might disagree with (for example a C design grade).
- Apply the preferences' rate-type rule when recommending a rate.

**Links are mandatory.** Every hotel named carries a Markdown link to its
Booking.com property page with the dates and rooms in the query string
(`https://www.booking.com/hotel/CC/SLUG.en-gb.html?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&group_adults=N&no_rooms=N`),
plus a link to the direct-site page whenever it was cross-checked. Hotels not
sold on Booking.com get their direct-site link and a note saying so.

Then drive the chosen booking up to the payment step and hand off for the
user to pay (see hard limits).

### Step 8: Record and grow the favourites

After the user confirms the booking:

1. Record it where the preferences say (for example the trip's itinerary
   file): hotel, dates, room, rate type, price and reference.
2. Offer to add the booked hotel, and any runner-up the user liked, to
   `data/favourites.json` for that city, so the next search there starts with
   them. Add a verdict once the user has stayed.

## Related skills

Accommodation is usually booked alongside travel; see **find-flights** and
**find-trains**. For Airbnb and short-term rentals use **find-airbnb**. For
journey times use **find-route**.
