# LUMEN — Pricing & Go-to-Market Case — ATELIA × ESCP Starter Kit

## Local pricing simulator

Run `npm start` and open http://127.0.0.1:4173. No dependency installation is needed. See [run instructions and verified calculations](RUN_SIMULATOR.md) and the [simulator brief](SIMULATOR_PROMPT.md). Run `npm test` for the calculation checks.

The simulator keeps €1.79, €2.19 and €2.59 as distinct choices, reports acceptance and contribution by channel, and blends contribution only after the chosen unit shares total 100%. It compares competitors using single 330 ml cans and offers recommendations under an explicit acceptance or contribution priority.

> This repo is your starting point. Codex should read this README first.

## How to Get Started

This repo is a **template**: click **Fork** (top right), not "Use this template." Fork keeps your copy linked back to the original — that's what lets ATELIA automatically find every team's work, without anyone needing to send a link.

Once you've forked it, add your teammates as collaborators (Settings → Collaborators on your fork), and leave the visibility as **Public** — don't switch it to Private, or we lose access to your work.

## The Brief

The full brief is in `LUMEN_Case_Brief.md` (and a formatted version in `LUMEN_Case_Brief.pdf`). The data is in the `data/` folder, documented in `data/README_data.md`.

One-sentence summary: LUMEN, a functional beverage brand, has to decide **price, positioning, and launch channel(s)** to enter the German market — with no real German sales data (LUMEN isn't there yet), and a real trade-off between the CMO (premium positioning) and the CFO (fast return on investment).

## Rule #1 — Prompt Logging Is Automatic

This repo includes an `AGENTS.md` file, which Codex reads automatically at the start of every task — you don't need to open or edit it. The first time you talk to Codex in a new conversation, it will ask for your **student ID**. Answer it, and from then on Codex logs every prompt you send it — automatically, verbatim — into `prompts/<your-id>/session-*.md`, without you doing anything else.

**You don't fill this in by hand.** Your only job is to make sure that log file gets committed along with your code changes — Codex writes it, but you still need to include it when your pull request is created and merged. If a pull request only has code changes and no updated log file, that's a sign something didn't get logged.

Why we're doing this: it's not to monitor you. It's what lets us understand, at the end, how you reasoned — not just what you produced. A good result reached with a clear prompt from the start isn't scored the same as a good result reached after fifteen random attempts.

## Rule #2 — Before You Code, Ask Yourself These Questions

Check each box in this README as you go — not at the end, while you're working:

- [x] **Data**: The dashboard uses the provided CSVs, but never loads or exposes the `name` or `email` columns from `customer_survey.csv`; only aggregated segment evidence is used because individual identities are irrelevant to the launch decision.
- [x] **API keys**: No external API, live weather feed, or API key is used; the dashboard relies only on the provided case data.
- [x] **Deployment**: The prototype has not been publicly deployed. The local server returns prepared aggregate case data, not the raw customer survey.
- [x] **Files generated along the way**: `case-data.json` is a derived build artifact containing only the prepared aggregates and decision inputs needed by the dashboard; raw source CSVs remain unchanged.
- [x] **Storage**: Scenarios are held in browser memory and are not persisted, which keeps customer data out of storage and makes the tool safe to reset between decisions.
- [x] **Robustness**: Empty, negative, non-numeric, or inconsistent inputs show a short inline message such as “Enter a numeric budget” or “No data for this combination”; valid cards continue working.
- [x] **Explainability**: The interface separates acceptance, net price, unit contribution, CAC, LTV, and payback proxy, and labels the German volume as an estimate rather than presenting one opaque score.
- [x] **Business relevance**: The prototype answers Freya's decision: which price belongs in which launch channel, how quickly acquisition spend can recover, and what trade-off the team accepts.

These questions aren't here to slow you down — they're part of what's being evaluated. A thoughtful answer to one of them is worth more than an extra feature nobody asked for.

## What We Expect at the End

- A prototype that works, even partially, on the LUMEN case
- Your prompt log (`prompts/<your-id>/session-*.md`) committed and up to date
- A short paragraph below, written in business language (not technical), explaining what you did and why
- A live URL (Vercel or similar) if you deployed it — not required to still get credit, but expected if you did

## Our Approach

We recommend a channel-differentiated German launch: use €2.19 as the anchor for Gym & Office and DTC Online, where it combines 51.7% acceptance with strong contribution of €1.13–€1.16 per can and fast payback against the selected marketing CAC, such as €28.14 for Referral / Subscription. Use €2.59 for Retail/Grocery, where retailer and distributor cuts erode the thinner-margin options and the premium price produces €0.86 contribution per can despite lower 26.7% acceptance. The dashboard keeps €1.79 visible as the maximum-acceptance option at 61.7%, but its €0.40–€0.81 contribution is the slower path to recovering acquisition spend. This prioritizes Elena's CFO goal of faster payback over Jonas's preference for one premium price point across every channel. We are deliberately not optimizing for one consistent brand price or maximum acceptance; we accept a more complex channel story to reach profitability faster. German volume is a clearly labeled estimate built from deduplicated NL/DK/SE history—706 raw rows reduced to 702 unique rows after removing 4 duplicate keys—not real German sales.

Implementation decisions: all customer evidence is aggregated before it reaches the browser; customer names and emails are never loaded. There are no API keys or external services. Source CSVs are unchanged, calculations run in browser memory, and scenarios are not persisted. Missing records and invalid inputs produce visible messages rather than blank or crashed sections. The prototype has not been publicly deployed.
