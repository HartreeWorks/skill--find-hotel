# Find hotel

A skill for finding a well-rated hotel near a specific address and getting the best price on it, without spending an evening clicking through Booking.com.

Your agent sweeps Booking.com (three pages of results plus a zoomed map view of the target area), applies your quality floor and must-haves, cross-checks the top options on the hotel's own site (including Hilton Honors rates), and then takes the booking you choose up to the payment step. You enter card details yourself.

## Requirements

- An agent that can drive your web browser (for example Claude Code with the Claude in Chrome extension).
- A Booking.com account, signed in in that browser. Optional: a Hilton Honors account, signed in on hilton.com.

The skill never enters payment details, creates accounts or signs in for you.

## Installation

```bash
# Run install
npx skills add HartreeWorks/skill--find-hotel

# When asked "Which agents do you want to install to?", select "Claude Code"
# in addition to the default "Universal" list.
```

If you get "command not found", [install Node](https://github.com/HartreeWorks/skills/blob/main/how-to-install-node.md) then try again.

## Try it

Ask your agent:

```text
Find me a hotel within 20 minutes' walk of King's Cross station, London, from Thursday 12 to Monday 16 November. I need a desk in the room and a review score of 8.5 or more.
```

You get a shortlist with prices, walking times, review scores and cancellation terms, each linked to its Booking.com page with your dates filled in, plus a recommendation and the direct-site price for the top options.

Edit the preferences in [SKILL.md](./SKILL.md) (rate type, amenities, loyalty programmes) to match your own.

## Documentation

See [SKILL.md](./SKILL.md) for complete documentation and usage instructions.

## About

Created by [Peter Hartree](https://x.com/peterhartree) of [AI Wow](https://wow.pjh.is).

Find more skills at [HartreeWorks/skills](https://github.com/HartreeWorks/skills).
