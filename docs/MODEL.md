# LUMEN scenario model

All forecasts are conditional illustrations, not validated German forecasts. `dist/simulation.js` is a pure browser-compatible module, with no network or storage dependencies. `createScenario`, `validateScenario`, `simulate`, and `compareScenarios` are the public interfaces.

## Volume and contribution

The data builder supplies monthly-equivalent units over the last 52 complete observed weeks for each country. The default reference is the median of country totals, not the median of channel observations. Excluding flagged outliers uses the same time denominator. Regional scope and segment selection never multiply sales.

Monthly units = reference monthly units × deployment percent / 100 × price response × monthly index / mean of 12 indices × ramp percent / 100. The first three ramp entries apply to months one through three; the fourth continues thereafter. Seasonality is normalized with the exact observed mean, not its rounded display value. Units remain fractional expected quantities until formatted.

Optional price response = selected tested acceptance / tested acceptance at €2.19. All current channels share the same acceptance. If future evidence has unequal channel response ratios, the model rejects this option rather than silently changing a sales-share mix. This is an assumption, not demonstrated elasticity.

Weighted contribution = sum(channel unit share × [official contribution − cost delta]). Weighted net revenue = sum(channel unit share × official net revenue). Percentage margin divides these weighted monetary values. Costs are not subtracted again. Acceptance remains channel-specific.

## Acquisition and recovery

Customers acquired per month = each channel's monthly marketing budget / (aggregate historical CAC × Germany CAC multiplier). Historical CAC is total spend / total acquisitions. Acquisition estimates do not add to commercial units; LTV is contextual only.

Monthly balance subtracts marketing, and also launch cost in the first month. Cumulative balance starts at negative launch cost and accumulates contribution minus marketing. Payback is the first strictly positive month; it does not promise the balance remains positive later. Horizons at 3, 6 and 12 months include the launch cost once. Unprovided costs, tax and working capital are excluded.

Sensitivities apply volume factors 0.75 / 1 / 1.25 and CAC factors 1.2 / 1 / 0.8. They have no statistical probability. A CAC change changes acquisitions, not profit under a fixed marketing budget.

Break-even deployment is modeled annual spending divided by contribution per deployment percentage point; break-even monthly units is the pre-ramp, pre-seasonality volume after price adjustment needed to cover spending. Non-positive contribution produces null thresholds. These thresholds target zero final balance, whereas payback requires a positive balance.

## Recommendation and safeguards

Targets test recovery time, minimum acceptance among selected channels, and total contribution. Comparisons list numerical trade-offs and narrow dominance only on balance, unit contribution and acceptance. They do not rank brand fit or select a winner. Identical starting strategies are explicitly recognized.

Validation rejects invalid weights, missing observations, unsupported prices, unknown segments/countries, non-finite values and impossible dates. Importing UI state must call validation before accepting it. Display untrusted text as text, and escape it in exported HTML.

Run `node --test tests/simulation.test.mjs` for independent arithmetic and invariant tests.
