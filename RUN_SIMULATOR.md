# Run the local simulator

With Node.js installed, run `npm start` from this repository, then open http://127.0.0.1:4173. There are no dependencies to install. Stop with Ctrl+C. Run `npm test` for calculation checks.

The local server only serves static interface files and the five approved CSVs. It provides no application backend, storage, authentication or external API. It does not expose the customer survey or prompt logs. Scenario state lives in memory and resets on refresh.

## Verification
- €1.79 Retail/Grocery contribution: €0.40 per can.
- €2.19 DTC Online tested acceptance: 51.7%.
- €2.59 Gym & Office contribution: €1.45 per can.
- €2.19, 40% DTC / 40% retail / 20% gym: contribution = 0.4×1.16 + 0.4×0.63 + 0.2×1.13 = €0.942; net revenue = €1.562; contribution margin = 60.3073%.
- Automated checks cover invalid allocations, missing/duplicate records, single-channel results and quoted CSV fields.

## Interpretation
Acceptance is identical across channels in the provided tests, but contribution is not. Recommendations rank the three tested prices under the chosen mix and explicit priority. The app does not recommend channel volumes without demand and capacity evidence or forecast payback without investment and acquisition assumptions. Competitor comparisons use single 330 ml cans because the multipack price basis is undocumented. Mate Libre has no DTC listing and Root & Rise has no Gym & Office listing in the file.

Source data is unchanged. The cost file contains a 30% home-market KPI row, not a €30 unit cost. Price-test net revenue and contribution are already after channel cuts. Percentages may differ slightly from supplied percentages because the latter and monetary values are rounded separately.
