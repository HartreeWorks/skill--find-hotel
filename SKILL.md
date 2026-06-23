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
Booking.com, where Peter is signed in (account: Peter Hartree, Genius Level 3).
Then cross-check the hotel's own/direct site (and the chain site for chains like
Hilton, Marriott, IHG). Book wherever the same room+rate is cheaper and actually
available. Booking.com is the default for consolidated management and Genius
perks, not an absolute rule — it is not always cheapest. Do not silently pick
Booking.com when direct is materially cheaper; surface the delta and let the
cheaper/available option win.

**Booking.com availability quirk.** Booking.com's *search-results* page
sometimes wrongly reports a property as "Unavailable on our site for your
selected dates" when the property *page* actually has rooms. Before concluding a
property is unavailable on Booking.com, open the direct property-page URL with
the dates in the query string (`.../hotel/.../NAME.html?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&group_adults=N&no_rooms=1`)
and re-check.

**Rate type — non-refundable by default, surface flexibility on risk.** Default
to the cheapest non-refundable rate (consistent with the find-flights fare-type
rule). No breakfast or insurance add-ons. **But** surface the flexible/refundable rate, with
its marginal cost, whenever there is real disruption risk — most commonly a
same-day flight/train arrival, a late-evening arrival, or a tight connection.
State both prices and let the user choose; do not auto-pick the flex rate.

**Location.** For an airport stopover, strongly prefer airport-adjacent hotels
(in-terminal or covered-walkway / short shuttle). For a city stay, prefer
central. If the area is ambiguous, ask before searching.

**Guests / rooms.** Default 1 adult, 1 room, no children unless stated.

**Currency.** Use the local currency of the property's country (GBP for the UK,
EUR for the eurozone). Note any FX implication for Peter's card. Booking.com
follows the account/region setting (often EUR for Peter); the property/chain
direct site may default to local currency — convert to compare like-for-like.
**Always pay in the property's local currency.** At the payment/rate-selection
step, decline any offer to charge in your card's home currency instead of the
property's local currency (dynamic currency conversion / DCC), which carries a
poor exchange markup. Peter's card handles the FX itself.

**Amenities — air conditioning (required; assumed in the USA), gym
(nice-to-have).** Air
conditioning is a hard requirement. Outside the USA, apply A/C as a default
search filter and confirm it on the property page before recommending. **Do not
apply the A/C filter for USA searches** — many US hotels have A/C as standard and
omit it from their amenity listings, so filtering on it there wrongly rules out
good options; assume A/C is present for US properties unless something indicates
otherwise. A gym/fitness centre is a nice-to-have: note its presence as a plus,
but never let its absence rule out an otherwise-good option.

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
the arrival date and flag same-day late arrivals (they drive the rate-type
decision above). If the request is clear, proceed without asking.

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
Cheapest bookable (non-refundable): [site] [room] — [CUR price] (incl. taxes; breakfast Y/N)
Flexible option: [site] [room] — [CUR price], free cancellation until DD Mon
Cheaper site: [Booking.com vs direct delta, if any]
Notes: [location/walkway, FX, anything material]
```

When there is disruption risk, ask which rate to book (non-refundable vs
flexible) before reserving. Then drive the chosen booking up to the payment
step and **hand off** for Peter to pay (see hard limits above).

### Step 5: Record

After Peter confirms the booking is done, update the relevant trip file (e.g.
`work/flights/*.md` for a flight trip, or the trip's own work file) with the
hotel, dates, rate type, and price.

## Related skills

Accommodation is usually booked alongside travel — see **find-flights** and
**find-trains**. Both default to non-refundable fares; this skill owns the
accommodation-specific preferences (Booking.com default, location, breakfast).
For Airbnb / short-term rentals use **find-airbnb**; for Montpellier long-term
flats use **apartment-search**.
