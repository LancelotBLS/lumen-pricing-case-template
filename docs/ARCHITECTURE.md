# LUMEN launch strategy application

The build reads twelve original case CSVs and emits a versioned CaseData JSON payload containing aggregate client evidence, historical references, economic inputs and provenance. Customer survey rows and respondent identifiers do not enter the browser bundle. Source files remain unchanged.

The browser creates two independent Scenario objects. The pure simulation module accepts a Scenario and CaseData and returns a SimulationResult with validated monthly commercial cashflows and separate marketing acquisition estimates. EvidenceReference is represented by source ID, original filename and description; the UI labels case data, calculations and assumptions.

The UI owns navigation, in-memory scenario state, chart rendering, import/export and explicit recommendation selection. Memo generation is a pure escaped HTML renderer. No API or storage is needed. The local server serves an exact allowlist of static files from dist; raw CSV and prompt-log routes return 404.

## Agent ownership

- Data agent: build pipeline, aggregate dataset, audit and data tests.
- Simulation agent: scenario validation, economic model, model documentation and calculation tests.
- Interface agent: navigation, controls, charts, scenario import/export and printable memo.
- Coordinator: contracts, integration, HTTP/publication checks, browser verification, prompt log, GitHub and Vercel handoff.

## Publication boundary

Run the build locally and prepare `output/vercel-preview` with `npm run package:preview`. Only seven allowlisted public app files and static Vercel configuration are copied. Deploy this prepared directory after verifying the destination account. Do not deploy the repository root: it contains the original customer CSVs and workshop logs. The package manifest records file hashes for review. Vercel account or project access must be established before uploading.
