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

- [x] **Data**: what data will your tool actually handle? Is any of it sensitive (personal data, company customer data)? `data/customer_survey.csv` has name/email columns — did you use them in your tool? If yes, how did you protect/anonymize them? If no, why did you choose not to expose them? (A team that never touches these columns should still be able to answer — "we chose not to use them" is a valid answer.)
- [x] **API keys**: if your tool calls an external API (weather, or anything else), where is the key stored? Never hardcoded in a file committed to GitHub. (A valid answer: "we didn't use any external API.")
- [x] **Deployment**: if you deployed a live demo, does any endpoint or response return raw, unfiltered data (e.g. the full survey with name/email) to any visitor?
- [x] **Files generated along the way**: if your tool (or Codex) created new files derived from the provided data, did you think about whether they should be committed to the repo or not?
- [x] **Storage**: if you're keeping any data, in what structure, and why that choice over another?
- [x] **Robustness**: what happens if the user gives an empty, inconsistent, or unexpected input?
- [x] **Explainability**: can you explain to someone non-technical why your tool does what it does?
- [x] **Business relevance**: does your prototype actually answer the problem posed in the brief, or is it an interesting technical build that's off-target?

These questions aren't here to slow you down — they're part of what's being evaluated. A thoughtful answer to one of them is worth more than an extra feature nobody asked for.

## What We Expect at the End

- A prototype that works, even partially, on the LUMEN case
- Your prompt log (`prompts/<your-id>/session-*.md`) committed and up to date
- A short paragraph below, written in business language (not technical), explaining what you did and why
- A live URL (Vercel or similar) if you deployed it — not required to still get credit, but expected if you did

## Our Approach

We built a local tool to compare launch prices and channel mixes without hiding the CMO/CFO trade-off. Users can change the mix and see which channels retain more contribution, how acceptance changes with price, and where LUMEN sits relative to competitors. Recommendations depend on the user's stated priority. We do not forecast German sales or payback without the additional demand, investment and acquisition assumptions those estimates require.

Implementation decisions: only the five specified case CSVs are served; customer names and emails are unused and the survey is not exposed by the local server. There are no API keys, external services, database or persistent scenario records. Source CSVs are unchanged; calculations happen in browser memory. Invalid channel mixes suppress blended results and recommendations, and missing records produce visible errors. Source links and calculation definitions explain the numbers. The prototype has not been publicly deployed.
