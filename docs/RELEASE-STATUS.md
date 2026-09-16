# Release readiness — 0.1.0 pilot

Assessment date: 2026-09-16. **Not ready for marketing as a verified live Conta integration.** A synthetic demonstration and implementation pilot are available; production, Cloud and accountant acceptance are not established.

## Implemented

- Modular TypeScript accounting logic and dependency-free bundled JavaScript Code nodes.
- Inactive manual/monthly n8n workflow with separate credentials, GET allowlist, disabled redirects, raw-byte response handling, bounded retries and Retry-After.
- Scope/account/currency attestations; exact signed opening/movement/closing checks; missing-data rejection and post-detail re-fetch.
- Conservative shared-reference candidates; source IDs and correction evidence; Norwegian private HTML/CSV/JSON with escaping and formula-injection protection.
- Credential-free 20-line synthetic demo, MIT license, English setup/API/privacy/acceptance documentation.
- Bilingual Bjorvand AI workflow-page source and synthetic downloads, prepared locally. A 90-second Norwegian silent explanatory video is rendered at 1920×1080, with a production script and explicit pilot notices. It is not a recording of live Conta use.

## Executed evidence

- TypeScript typecheck, 51 deterministic accounting/workflow tests, bundle build and reproducible synthetic acceptance: passed.
- Local self-hosted n8n 2.39.6 on Windows/Node 24.13.1: eight scenarios passed. The full request loop used actual HTTP nodes, separate synthetic Header Auth credentials and a local fixture server, covering both organization branches, Retry-After/Wait, forbidden responses and changed totals. Separate probes verified exact raw-byte IDs/amounts and rejected redirects. The synthetic demo and invalid configuration also passed. See `release/n8n-smoke-results.json` for the run record and workflow hashes. This is CLI testing, not a Cloud or live Conta claim.
- Norwegian HTML demo opened and visually inspected in the built-in browser. It shows NOK 25,000 closing residual = NOK 15,000 opening + NOK 10,000 movement, nine candidates and two unresolved lines. No live data was included.
- n8n's hardened runner exposed a bundler export incompatibility; corrected and regression-tested. Its HTTP text mode rounded a 64-bit ID; raw-file mode corrected this and passed an actual HTTP-node test.
- Local Bjorvand AI production build and 307 localization/routing assertions passed across 28 pages. Both Conta page languages were checked at 390, 768, 1440 and 1920 pixels with no horizontal document overflow. Setup modals open in the correct language and Escape closes them. The embedded calendar remained loading in the local browser; both direct Cal.com fallback pages opened with the correct event/language. No booking was submitted.
- Eight local downloads matched their source bytes: live pilot template, synthetic demo, HTML/CSV/JSON reports, setup guide, video and source archive. Both language pages and generated social-preview images returned HTTP 200. The source archive was extracted and every manifest file hash verified.

## Remaining launch gates

| Gate | Status | Required evidence |
| --- | --- | --- |
| Two authorized Conta companies and approved dedicated accounts | Blocked: unavailable | Same-month known reports, access and explicit scope approval |
| Live signs/dates/opening/omission/correction semantics | Not run | Completed `LIVE-ACCEPTANCE.md` with accountant review |
| n8n Cloud | Not run: environment unavailable | Imported workflows, actual HTTP/credential behavior, downloads, retry and failure checks |
| Operational schedule and retention | Not run | Real scheduled execution plus private retrieval/pruning verification |
| Website publication and public download checks | Not published | Verified deployed bilingual page and working downloads/booking |
| Norwegian video | Silent synthetic explainer prepared | Review the pilot wording before publication; narration is not included |

Do not remove the pilot notice, enable unverified COMPLETE results, or convert synthetic/local evidence into claims of verified live compatibility. No emails or Conta writes were made. Local completion is not publication or accountant acceptance.
