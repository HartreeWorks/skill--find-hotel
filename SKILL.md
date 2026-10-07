---
name: find-hotel
description: >
  This skill should be used when the user asks to "find a hotel", "book a
  hotel", "search hotels", "find a room", "find somewhere to stay" near an
  airport or in a city, or to book accommodation alongside a flight or train.
  It searches Booking.com (signed in), cross-checks the property's direct site,
  applies Peter's preferences, and drives a reservation up to the payment step.
  Default to hotels; for Airbnb / short-term rentals use find-airbnb; for
  Montpellier long-term flats use apartment-search.
---

# Find hotel

Search for hotels, compare rates across Booking.com and the property's direct
site, and drive a reservation up to (but not through) payment.

## Booking preferences

**Where to book — default to Booking.com, but cross-check direct.** Start on
Booking.com, where Peter is signed in. Then cross-check the hotel's own/direct
site (and the chain site for chains like Hilton, Marriott, IHG). Booking.com is
the default for consolidated management and Genius perks, but it is not always
cheapest — book wherever the same room+rate is cheaper and available, surfacing
the delta rather than silently defaulting to Booking.com.

**Hilton properties — prefer hilton.com, and use the Honors rate.** This applies
to **Hilton-family brands only** (Hilton, Hampton by Hilton, DoubleTree, Hilton
Garden Inn, Curio, Canopy, Waldorf Astoria, Conrad, Embassy Suites, Tru,
Motto, Signia, LXR, Tempo, Home2 Suites, Homewood Suites). Peter holds a Hilton
Honors membership and wants the Honors member rate quoted and used.

- Quote the **Honors Discount** rate, not just the public rate. On hilton.com's
  "Select a Rate" step, each rate shows a public price and an Honors Discount
  price side by side; capture both.
- **Book direct when the Honors rate is cheaper than *or equal to* Booking.com.**
  Direct also earns Honors points and stay credit, which an OTA booking does not,
  so parity is enough to justify booking direct — a strict discount is not needed.
- Only fall back to Booking.com when it is genuinely cheaper than the Honors rate.
- Peter should already be signed in to hilton.com. **If hilton.com is signed out,
  do not sign in** (see hard limits) — surface the public rates, note that the
  Honors rate is likely lower, and hand off to Peter to sign in.

For **other chains** (Marriott, IHG, Accor, etc.), Peter has no loyalty status, so
apply the plain default above: compare openly bookable rates and pick the cheaper.

**Booking.com availability quirk.** Booking.com's *search-results* page
sometimes wrongly reports a property as "Unavailable on our site for your
selected dates" when the property *page* actually has rooms. Before concluding a
property is unavailable on Booking.com, open the direct property-page URL with
the dates in the query string (`.../hotel/.../NAME.html?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&group_adults=N&no_rooms=1`)
and re-check.

**Rate type — non-refundable by default.** Default to the cheapest
non-refundable rate, no breakfast or insurance add-ons. Take the
flexible/refundable rate only when it costs less than £10 more than the
non-refundable one; otherwise book non-refundable without asking.

**Location.** For an airport stopover, in-terminal or within walking distance is
the most desirable (a covered walkway is not important). A short shuttle is
acceptable but second-best. For a city stay, prefer central. If the area is
ambiguous, ask before searching.

**Quality floor.** Exclude properties scoring below 8.0 ("Very good") on
Booking.com's guest review score; rank the rest on price and preference fit.
Note the score in the recommendation. Apply Booking.com's built-in review-score
facet rather than scrolling past low-rated results — tick "Very good: 8+" (or
"Superb: 9+" when there is plenty of choice), or append `nflt=review_score%3D80`
(8+; use `90` for 9+) to the search URL.

**Guests / rooms.** Default 1 adult, 1 room, no children unless stated.

**Currency.** Use the property's local currency (GBP for the UK, EUR for the
eurozone), converting to compare like-for-like across sites. Always pay in the
property's local currency: decline any dynamic currency conversion (DCC) offer
to charge in the card's home currency, which carries a poor markup.

**Amenities — air conditioning (required; assumed in the USA), desk/workspace
(required), gym (very nice-to-have).** Air conditioning is a hard requirement.
Outside the USA, apply A/C as a default search filter and confirm it on the
property page before recommending. **Do not apply the A/C filter for USA
searches** — many US hotels have A/C as standard and omit it from their amenity
listings, so filtering there wrongly rules out good options; assume A/C is
present for US properties unless something indicates otherwise. A desk or usable
workspace is also required, but do not filter strictly on it — it is often
omitted from amenity filters even when present, so confirm it from the room
description or photos rather than excluding properties a filter doesn't tag. A
gym/fitness centre is highly desirable whenever
the stay leaves time to use it (i.e. not a late-arrival/early-departure
stopover) — weight it as a strong plus, but never let its absence rule out an
otherwise-good option.

**Breakfast / extras.** Note when breakfast is included (Hampton/Hilton family
usually includes it). Do not add parking, upgrades, or paid extras unless asked.

## What this skill must never do

These are hard limits, regardless of how the task is phrased:

- **Never enter payment/card details, and never complete a purchase.** Drive the
  booking up to the reservation/payment step, then hand off to Peter to enter
  card details and confirm.
- **Never create an account or sign in with a password.** Peter is already
  signed in to Booking.com; if a site is logged out, hand off rather than
  authenticating.
- **Never click the final irreversible "Reserve" / "Book now" / "Confirm"
  control without explicit confirmation** for that specific booking (hotel,
  dates, rate, price).

## Workflow

### Step 0: Model check

Check which model is running (stated in the system prompt's environment
block). If it is a Mythos-class model (Fable), pause before searching and
tell Peter this task does not need that tier. Offer:

1. Continue on the current model.
2. Delegate the whole workflow to a subagent on a cheaper model (Agent tool
   with `model: "sonnet"`; subagents share the session's browser tools).
3. He relaunches the session on a cheaper model (`/model`).

Wait for his choice. On Opus, Sonnet, or Haiku, skip this step and proceed.

### Step 1: Confirm inputs if needed

Confirm destination (airport vs city), check-in and check-out dates (derive
nights), and guests. If booking alongside a flight/train, derive check-in from
the arrival date. If the request is clear, proceed without asking.

### Step 2: Search Booking.com

Open Booking.com signed in. Either use the search box or go straight to a search
URL:

```text
https://www.booking.com/searchresults.html?ss=HOTEL+OR+AREA&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&group_adults=1&no_rooms=1&group_children=0&nflt=review_score%3D80
```

For an area search, sweep the area in two passes before shortlisting. A
single price-sorted results page misses mid-priced properties.

1. **List view, pages 1–3.** Read every result on the first three pages
   (about 25 per page; use the pager or add `&offset=25`, then `&offset=50`).
   The pass is done when page 3 has been read or the results run out.
2. **Map view, zoomed to the target.** Tick "Only show available properties"
   first (`nflt=oos%3D1` in the URL), then open the map and zoom in on the
   exact target (the office or address, not the district name) until the
   pins span the acceptable walking radius. Pan until the whole radius is
   covered, and read the name and price of every pin. The pass is done when
   every pin inside the radius is on the candidate list or ruled out.

For a named hotel, open its property page directly and apply the
availability-quirk check above if it shows unavailable. Read the room/rate table
("I'll reserve" / availability section) and capture, per rate: price (total and
per night), refundable vs non-refundable, prepay vs pay-at-property, and
breakfast.

### Step 3: Cross-check the direct site

Search the hotel's own or chain site for the same room, dates, and guests.
Capture the equivalent non-refundable and flexible rates. Watch for currency
differences (convert to compare like-for-like).

**Loyalty rates.** For **Hilton-family properties**, capture the Honors Discount
rate as well as the public rate and apply the Hilton rule in Booking preferences
above (book direct at parity or better). For every other chain, compare only the
openly bookable rates. Never sign in to obtain a loyalty rate — if the site is
logged out, report the public rates and hand off.

### Step 4: Present and decide

Present the recommendation in this format:

```text
**HOTEL — CITY/AIRPORT · check-in DD Mon → check-out DD Mon (N night/s) · G guest/s**
Recommended (non-refundable): [site] [room] — [CUR price] (incl. taxes; breakfast Y/N)
Flexible delta: [+CUR X for free cancellation until DD Mon — taken if <£10, else noted]
Cheaper site: [Booking.com vs direct delta, if any; for Hilton, quote the Honors rate]
Notes: [location/transfer, score, A/C confirmed, anything material]
Links: [Booking.com property page with dates] · [direct site, if checked]
```

**Links are mandatory.** Every hotel named in a recommendation, shortlist, or
written report carries a Markdown link to its Booking.com property page with
the stay's dates and rooms in the query string
(`https://www.booking.com/hotel/gb/SLUG.en-gb.html?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&group_adults=N&no_rooms=N`),
plus a link to the direct-site page whenever it was cross-checked. Peter
should be able to open any option from the report without searching again.

Apply the rate-type rule above (non-refundable unless flexible costs <£10 more),
then drive the chosen booking up to the payment step and **hand off** for Peter
to pay (see hard limits above).

### Step 5: Record

After Peter confirms the booking is done, update the relevant trip file (e.g.
`work/flights/*.md` for a flight trip, or the trip's own work file) with the
hotel, dates, rate type, and price.

## Related skills

Accommodation is usually booked alongside travel — see **find-flights** and
**find-trains**. For Airbnb / short-term rentals use **find-airbnb**; for
Montpellier long-term flats use **apartment-search**.
