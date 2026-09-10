# LUMEN pricing and channel simulator — agreed build brief

## GOAL
Build a pricing and channel strategy simulator for LUMEN’s Germany market entry that helps users reach a defensible launch recommendation.

Let users compare €1.79, €2.19 and €2.59 and explore channel mixes, showing the trade-offs between tested customer acceptance, contribution margin, and competitive positioning, addressing the CMO’s premium ambition and the CFO’s payback priorities.

Recommendations must respond to the selected scenario and explicit decision criteria, with traceable data and visible assumptions. German sales or payback estimates require comparable-market evidence; there is no German sales history.

## CONTEXT
Read LUMEN_Case_Brief.pdf and data/README_data.md before implementation. Use price_test_results.csv, channel_economics.csv, cost_breakdown.csv, competitor_prices_by_channel.csv and market_context.csv from /data. Do not invent missing values. Use supplied contribution margins as primary evidence and avoid double-counting costs or channel deductions.

## CONSTRAINTS
- One selected candidate price across selected channels; never average the three launch prices.
- Channel mix means shares of units sold, totaling 100%.
- Show acceptance separately by channel; do not infer overall acceptance or sales from the mix.
- Blend contribution per unit by unit share. Calculate contribution percentage as weighted contribution divided by weighted net revenue.
- Keep gross margin, contribution and net revenue distinct.
- Recommendations use explicit priorities without hidden scoring or silently choosing positioning.
- Do not infer payback from unit contribution or achievable sales from market size.
- Local only, no backend business logic, database, authentication or external API. In-memory state; no secrets.
- White, clean interface, business labels in € and %, designed for Freya, Jonas and Elena.
- Show competitor points or supported ranges using comparable pack sizes and units. Explain missing listings.

## DONE WHEN
- Users select any candidate price and a channel or valid channel mix.
- Acceptance and contribution remain visible per channel; blended contribution updates with the mix.
- All three prices can be compared under the same mix.
- Competitor positioning is visible by channel.
- Guidance updates with an explicit priority and shows the sacrifice involved.
- Verify three raw CSV values and one independent blended calculation.
- Run locally and show the rendered interface; document run instructions and limitations.
