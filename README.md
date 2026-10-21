# Find hotel

> **Updating (for agents).** If you were asked to update this skill, follow these steps exactly, in order. A plain `npx skills update` deletes the installed skill folder, and copies installed before October 2026 keep the user's preferences inside it, in `data/`.
>
> 1. Find every installed copy: folders named `find-hotel` under `~/.agents/skills/`, `~/.claude/skills/`, `~/.codex/skills/` and the project's `.claude/skills/` or `.agents/skills/`.
> 2. If an installed copy has `scripts/check-update.sh`, run `bash scripts/check-update.sh --apply` from the project folder and stop here: it handles migration and the update itself.
> 3. Otherwise, download this repository to a temporary folder (`git clone --depth 1 https://github.com/HartreeWorks/skill--find-hotel`) and, for each installed copy that has a `data/` folder, run `bash <temporary folder>/scripts/migrate.sh --from <installed copy>`. It backs up the data, copies it to `~/.config/hartreeworks-skills/find-hotel/`, verifies the copy and stops on conflicts. Do not continue until every copy reports "Migrated" or "Nothing to migrate"; show the user any conflict.
> 4. Install the latest release, giving the scope explicitly: `npx -y skills@1.7.4 add HartreeWorks/skill--find-hotel#v$(cat <temporary folder>/VERSION) --skill find-hotel -g -y` for a global copy, and the same without `-g`, run from the project folder, for a project copy.
> 5. Confirm `~/.config/hartreeworks-skills/find-hotel/` holds the user's files, then tell the user what changed (`CHANGES.md`).

A skill for finding the hotel you would have picked yourself (best-rated, best-designed and good value) without spending an evening clicking through Booking.com.

Your agent starts from your favourite hotels in the city and prices them for your dates. It then sweeps Booking.com for better-rated alternatives within your price band. For each contender it:

- grades the room design and the desk from the photos, against your taste;
- checks the gym for free weights;
- reads the 100 newest Booking.com reviews in full, labels every noise complaint, and estimates the chance the hotel is noisier than your threshold;
- skims Google Maps reviews for Wi-Fi, broken air conditioning and other deal-breakers;
- gets journey times to the places you need to reach.

It cross-checks the top options on the hotel's own site, including loyalty rates, and takes the booking you choose up to the payment step. You enter card details yourself.

## Your preferences and favourites

On first run the skill asks a few questions: your booking accounts and loyalty programmes, your rate type, the review score you expect, your must-haves, how you get around cities, and two or three hotels you have loved. It looks at the photos of those hotels to write a description of your room taste, and saves everything to `~/.config/hartreeworks-skills/find-hotel/`, outside the skill folder, so updates never touch it:

- `preferences.md`: your rules, taste, price guidance and city-specific area rules (for example "anywhere within 20 minutes' cycle in central London").
- `favourites.json`: hotels you like, by city. After each booking the skill offers to add the hotel, so every search in that city starts from your list.

Edit either file at any time. Starter versions are in `examples/`.

## Updates

At most once a day, the skill checks for a new release. When there is one, your agent shows what changed and asks whether to update now, update now and automatically from now on, or not now.

## Requirements

- An agent that can drive your web browser (for example Claude Code with the Claude in Chrome extension).
- A Booking.com account, signed in in that browser. Optional: loyalty accounts (such as Hilton Honors) signed in on the chain's site.
- [uv](https://docs.astral.sh/uv/), to run the noise estimator.
- Optional: the [find-route](https://github.com/HartreeWorks/skill--find-route) skill, for journey times.

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
Find me a hotel in central London for Saturday 14 November, around £200–300. I'll be at an event near London Bridge in the evening.
```

You get a short table comparing your favourites with the best alternatives the sweep found. Each row has the review score, design grade, desk and gym verdicts, non-refundable and flexible prices, journey times and a one-line review note, all linked to Booking.com with your dates filled in. A recommendation comes first.

## Documentation

See [SKILL.md](./SKILL.md) for complete documentation and usage instructions.

## About

Created by [Peter Hartree](https://x.com/peterhartree) of [AI Wow](https://wow.pjh.is).

Thanks to [Pablo Stafforini](https://stafforini.com) for feedback and contributions to the skill.

Find more skills at [HartreeWorks/skills](https://github.com/HartreeWorks/skills).
