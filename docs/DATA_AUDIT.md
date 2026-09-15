# LUMEN public data preparation

`node build.mjs` reads all 12 source CSVs, validates their complete column headers and required numeric fields, and writes `dist/case-data.json`. Original data files remain unchanged. The build removes only generated CSV files directly inside verified `dist/data`; raw surveys must never be deployed. Run `node --test tests/data.test.mjs` for source reconciliation checks.

## Source findings

- Historical sales: 706 records, 702 unique complete records, four exact duplicates removed. No German sales exist.
- Benchmark window: 52 distinct weekly periods, 2025-07-07 through 2026-06-29. Sum units over this window and divide by 12. Monthly country benchmarks are Netherlands 30,467; Denmark 18,305.083333; Sweden 22,941.75. The median is Sweden's value.
- Outlier rule: linear-interpolated Q1/Q3 within each country/commercial-channel group over all 78 deduplicated weeks. Flag units below Q1 − 3×IQR or above Q3 + 3×IQR. **No observations cross these fences.** The unusual spike mentioned in the guide is not automatically an outlier under this conservative, specified rule. Consequently the with/without-outliers benchmark is currently identical. No alternate rule was substituted. If future rows cross the fences, excluding them retains the full 12-month denominator, without imputation.
- Seasonality indices total 1,220, so the actual mean is 101.6666666667, rather than 100. Divide each index by this mean; factors total 12 and preserve an annual constant volume.
- Price tests: nine records, three prices × three commercial channels. Contribution is €0.77 at €1.79 DTC, €0.63 at €2.19 retail, and €1.45 at €2.59 gym/office. Acceptance is identical between channels at each price in this supplied dataset, but remains channel-specific evidence.
- Unit costs sum to €0.62. The €0.62 total is not added again. The line containing 30 is the home-market gross margin percentage, not a cost.
- The customer survey contains 420 people; the price-perception survey contains 300 different survey observations. Their IDs are not joined. Published output contains only customer aggregates, price curves and the supplied anonymous qualitative quotes. Individual names, emails and respondent IDs are excluded.
- Marketing channels are separate from commercial channels. CAC is total spend divided by total acquisitions, not an unweighted average of monthly CAC. Paid Social: €43,588.69 / 952 = €45.7864390756. LTV is an acquisition-weighted historical reference; no profit/cash-flow meaning or horizon is inferred.
- Current competitor records preserve format labels, allowing the interface to restrict quantitative comparisons to individual 330ml cans. Multipack units remain ambiguous. Historical competitor promotions have no commercial channel and must not be given one.
- Market years remain as supplied. Regional splits are illustrative rather than validated local sales forecasts.

## Price-perception curves

For each segment and all segments, generate prices from €0.50 to €4.00 inclusive in €0.05 increments. At price p, `tooCheapPct` is the share with too-cheap threshold ≥ p; `cheapPct` is the share with cheap threshold ≥ p. `expensivePct` is the share with expensive threshold ≤ p; `tooExpensivePct` is the share with too-expensive threshold ≤ p. These are empirical survival/CDF curves including ties, not purchase probabilities, causal elasticity or projections of units. Segment populations are reported independently from the customer survey.

## Public contract and provenance

CaseData schema version 1 includes sources, audit, prices, economics, costs, competitors, competitorHistory, market, seasonality, historical, marketing, segments, customersByCity, quotes and pricePerception. Raw-column field names are retained for nonsurvey case tables. Numeric values are converted explicitly; promotion flags are booleans. `segments` and `pricePerception` include `All segments`; per-city rows include both all-segment and segment aggregates. Every source entry identifies its original CSV, while the public app never needs to fetch raw customer records.
