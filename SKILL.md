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
Note the score in the recommendation.

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

### Step 1: Confirm inputs if needed

Confirm destination (airport vs city), check-in and check-out dates (derive
nights), and guests. If booking alongside a flight/train, derive check-in from
the arrival date. If the request is clear, proceed without asking.

### Step 2: Search Booking.com

Open Booking.com signed in. Either use the search box or go straight to a search
URL:

```text
https://www.booking.com/searchresults.html?ss=HOTEL+OR+AREA&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&group_adults=1&no_rooms=1&group_children=0
```

For a named hotel, open its property page directly and apply the
availability-quirk check above if it shows unavailable. Read the room/rate table
("I'll reserve" / availability section) and capture, per rate: price (total and
per night), refundable vs non-refundable, prepay vs pay-at-property, and
breakfast.

### Step 3: Cross-check the direct site

Search the hotel's own or chain site for the same room, dates, and guests.
Capture the equivalent non-refundable and flexible rates. Watch for currency
differences (convert to compare like-for-like) and Honors/loyalty rates that
require a login — do not log in to obtain them; compare only the openly bookable
rates.

### Step 4: Present and decide

Present the recommendation in this format:

```text
**HOTEL — CITY/AIRPORT · check-in DD Mon → check-out DD Mon (N night/s) · G guest/s**
Recommended (non-refundable): [site] [room] — [CUR price] (incl. taxes; breakfast Y/N)
Flexible delta: [+CUR X for free cancellation until DD Mon — taken if <£10, else noted]
Cheaper site: [Booking.com vs direct delta, if any]
Notes: [location/transfer, score, A/C confirmed, anything material]
```

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
