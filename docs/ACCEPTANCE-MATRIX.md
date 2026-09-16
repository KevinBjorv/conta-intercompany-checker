# Specification acceptance matrix

Audited against `SPEC.md` on 2026-09-16. This matrix preserves the full release scope. A passed synthetic test proves the tested behavior, not live Conta semantics or Cloud compatibility.

| Requirement | Authoritative evidence | Result |
| --- | --- | --- |
| Two authorized organizations, dedicated accounts, NOK books/positions | `src/config.ts`; scope rejection tests in `tests/core.test.ts` | Implemented. Real authorization and accountant-approved account scope unavailable. |
| One completed calendar month and shared cutoff | `scopeFor`; leap-February, year rollover, Oslo month boundary and detail cutoff tests | Synthetic checks pass. Inclusive Conta date semantics still require direct report comparison. |
| GET-only allowlist, customer credentials, no keys in workflow JSON | `src/transport.ts`, generated HTTP nodes and `tests/workflow.test.ts`; actual HTTP/credential loop in `release/n8n-smoke-results.json` | Local tests pass. Separate dummy credentials confirmed per side. Live access unverified. |
| Trial balances and every selected account's details | `requestPlan`; multiple-account test; HTTP loop request-order assertion | Local tests pass. Documented account-list `hits=0` completeness needs live verification. |
| Source IDs, original amounts and retrieval timestamps | `src/adapter.ts`, `src/types.ts`; raw-byte HTTP probe with 64-bit ID; report JSON | Implemented and locally verified. |
| Exact decimal-safe accounting; opening + movement = closing | `src/money.ts`, `src/compare.ts`; signed, fractional, large-value and inconsistent-total tests | Passed with synthetic evidence. |
| Detail sums equal reported movement; absent accounts are unknown | `compare`; missing account, explicit zero, malformed schema and mismatch tests | Passed with synthetic evidence. |
| Separate signed opening, movement and closing residuals; magnitude | 20-line demo and renderer tests; `release/demo/rapport.*` | 15,000 opening + 10,000 movement = 25,000 closing NOK. HTML/CSV/JSON retain the distinction. |
| Re-fetch totals and detect changes without atomic-snapshot claims | Request order, changed-total unit test and n8n HTTP scenario; report caveat | Local tests pass. Concurrent live behavior is not established. |
| Conservative one-to-one reference suggestions; ambiguity/reversals remain review items | `src/candidates.ts`; duplicate, missing/shared-reference, date and reversal tests | Implemented. Live invoice/reference and correction semantics remain unverified. |
| COMPLETE/INCOMPLETE separate from agreement; unknown is never zero | `src/engine.ts`, `src/compare.ts`, incomplete-render tests and n8n failure scenarios | Local tests pass. Host termination may yield no report; execution failure is explicitly not success. |
| Norwegian HTML/CSV/JSON, mappings, evidence, reasons and unresolved items | `src/report.ts`, generated demo artifacts and renderer tests | Implemented. Unknown review counts are shown as not assessed. |
| HTML escaping, CSV formula protection, bounded retries, Retry-After | Core tests, actual HTTP 429/Wait and redirect probes | Passed locally; Cloud runtime behavior unverified. |
| Private handling and documented retention | Workflow execution settings and `docs/SETUP.md` | Supplied configuration/documentation exists. Operational retention and scheduled retrieval require deployment acceptance. |
| Manual/monthly workflow, modular TypeScript, bundled Code nodes, standard HTTP nodes, no runtime imports/backend | `scripts/build.mjs`, workflow assertions and real local n8n execution | Manual local execution passed. Monthly production operation not accepted. |
| Self-hosted and Cloud compatibility testing | n8n 2.39.6 Windows/Node 24.13.1 run record | Self-hosted synthetic CLI tests pass; n8n Cloud unavailable and untested. |
| MIT original code/template, fixtures and English setup docs | `LICENSE`, source distribution manifest and GitHub repository | Source package prepared; public distribution is a separate recorded release action. |
| Norwegian video with synthetic data | `release/demo/conta-demonstrasjon.mp4`, `release/video-verification.json` | 90-second 1920×1080 silent explainer produced; no narration or live-provider recording. |
| Bjorvand AI page with downloads and implementation CTAs, no redesign | `site/`, existing site components; 307 local checks; responsive/browser and byte-level download verification | Local bilingual page passes. Public deployment/booking validation remains a release action. |
| Match known authorized Conta reports | `docs/LIVE-ACCEPTANCE.md` | NOT RUN: the second organization, approved accounts and test access are unavailable. |

Full completion is blocked by the unverified live and Cloud requirements. A public pilot must retain those limitations and must not be described as a completed reconciliation or a verified live integration.
