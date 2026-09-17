# Release readiness — 0.1.0 pilot

Assessment updated: 2026-09-17. **Ready to market the synthetic demonstration and assisted pilot with explicit limitations. Not ready to market as a verified live Conta integration.** Live Conta, Cloud and accountant acceptance are not established. See `PILOT-LAUNCH.md` for usable announcement drafts and the first-pilot sequence; this does not mark the full specification complete.

## Implemented

- Modular TypeScript accounting logic and dependency-free bundled JavaScript Code nodes.
- Inactive manual/monthly n8n workflow with separate credentials, GET allowlist, disabled redirects, raw-byte response handling, bounded retries and Retry-After.
- Scope/account/currency attestations; exact signed opening/movement/closing checks; missing-data rejection and post-detail re-fetch.
- Conservative shared-reference candidates; source IDs and correction evidence; Norwegian private HTML/CSV/JSON with escaping and formula-injection protection.
- Credential-free 20-line synthetic demo, MIT license, English setup/API/privacy/acceptance documentation.
- Bilingual Bjorvand AI workflow page and synthetic downloads, published. A 90-second Norwegian silent explanatory video is rendered at 1920×1080, with a production script and explicit pilot notices. It is not a recording of live Conta use.

## Executed evidence

- TypeScript typecheck, 53 deterministic accounting/workflow tests, bundle build and reproducible synthetic acceptance: passed. Incomplete reports show unknown review counts as not assessed, and CSV retains the selected account mapping, signed residual, magnitude and candidate reasons.
- Local self-hosted n8n 2.39.6 on Windows/Node 24.13.1: eight scenarios passed. The full request loop used actual HTTP nodes, separate synthetic Header Auth credentials and a local fixture server, covering both organization branches, Retry-After/Wait, forbidden responses and changed totals. Separate probes verified exact raw-byte IDs/amounts and rejected redirects. The synthetic demo and invalid configuration also passed. See `release/n8n-smoke-results.json` for the run record and workflow hashes. This is CLI testing, not a Cloud or live Conta claim.
- Norwegian HTML demo opened and visually inspected in the built-in browser. It shows NOK 25,000 closing residual = NOK 15,000 opening + NOK 10,000 movement, nine candidates and two unresolved lines. No live data was included.
- n8n's hardened runner exposed a bundler export incompatibility; corrected and regression-tested. Its HTTP text mode rounded a 64-bit ID; raw-file mode corrected this and passed an actual HTTP-node test.
- Local Bjorvand AI production build and 307 localization/routing assertions passed across 28 pages. Both Conta page languages were checked at 390, 768, 1440 and 1920 pixels with no horizontal document overflow. Setup modals open in the correct language and Escape closes them. The embedded calendar remained loading in the local browser; both direct Cal.com fallback pages opened with the correct event/language. No booking was submitted.
- Production recheck on 2026-09-17 resolved the calendar loading uncertainty: both embedded calendars displayed the correct localized event, 20-minute Google Meet duration, Europe/Oslo and available times. Escape closed both modals. Slot selection and booking submission are not verified.
- Eight local downloads matched their source bytes: live pilot template, synthetic demo, HTML/CSV/JSON reports, setup guide, video and source archive. Both language pages and generated social-preview images returned HTTP 200. The source archive was extracted and every manifest file hash verified.
- A real activated local n8n Schedule Trigger passed on 2026-09-17 using a one-minute test cadence, synthetic credentials and a loopback API. It selected August 2026 as the last completed month, made eight GET requests and persisted the 20-line/NOK 25,000 result. HTML/CSV/JSON were decoded from saved execution storage. The server was stopped and the test workflow unpublished. See `release/n8n-schedule-results.json`. This does not establish monthly production operation, pruning policy or Cloud behavior.
- Actual n8n 2.39.6 automatic soft/hard pruning passed on 2026-09-17 in a disposable copy of that synthetic execution. Execution and payload rows, including inline HTML/CSV/JSON, were removed; original evidence was preserved and the owned test server stopped. See `release/n8n-retention-results.json` and `docs/RETENTION.md`. External binary stores, backups, physical secure erasure and Cloud remain outside the test.

## Full release and customer activation gates

| Gate | Status | Required evidence |
| --- | --- | --- |
| Two authorized Conta companies and approved dedicated accounts | Blocked: unavailable | Same-month known reports, access and explicit scope approval |
| Live signs/dates/opening/omission/correction semantics | Not run | Completed `LIVE-ACCEPTANCE.md` with accountant review |
| n8n Cloud | Not run: environment unavailable | Imported workflows, actual HTTP/credential behavior, downloads, retry and failure checks |
| Operational schedule and retention | Local synthetic trigger, saved-report retrieval and automatic pruning passed | Customer storage/access approval and deployment verification remain necessary before activation. The actual monthly production run is subsequent operational evidence, not a prerequisite for marketing the pilot. Cloud remains unverified. |
| Website publication and public download checks | Published as a labeled pilot | Both language routes observed; browser download matched the tested workflow. Both localized embedded booking calendars now load and show available times; direct fallback is available. See `PUBLICATION.md`. No booking was submitted. |
| Norwegian video | Published silent synthetic explainer | Pilot limits are explicit; narration is not included |

The public source repository and v0.1.0 prerelease are available at `https://github.com/KevinBjorv/conta-intercompany-checker`. The website is published at `https://bjorvand.ai/workflows/conta-intercompany-checker` with an English counterpart. See `PUBLICATION.md` for immutable source and deployment evidence. Documentation inside the v0.1.0 source archive and website download folder is the earlier release-preparation snapshot; this repository's current status supersedes its publication status only. The live acceptance limitations remain unchanged.

Public availability does not establish live compatibility. Do not remove the pilot notice, enable unverified COMPLETE results, or convert synthetic/local evidence into claims of verified live compatibility. No emails or Conta writes were made. Publication is separate from accountant acceptance.
