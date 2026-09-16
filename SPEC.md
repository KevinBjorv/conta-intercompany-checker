# Conta Intercompany Checker

## Goal
Publish a free n8n workflow that compares intercompany balances between two Conta companies and prepares evidence for accountant review. Norwegian name: Mellomværendekontroll for Conta. Sell setup/customization through Bjorvand AI.

## MVP
- Two explicitly authorized Conta organizations; one bilateral relationship.
- Dedicated balance-sheet accounts on each side, selected manually for this relationship. Reject mixed-counterparty accounts; do not infer ownership.
- NOK books and NOK-denominated positions only; one calendar-month period with a shared cutoff.
- Manual run or monthly for the last completed month; Norwegian HTML/CSV and JSON.
- No AI, OCR, posting, payments, external email, consolidation, tax advice, dashboard or additional accounting providers.

## Access and API
Use customer-owned credentials and organization IDs. Production needs active subscriptions and user access. Keys inherit user privileges; do not claim they are read-only. Enforce GET-only requests to allowlisted Conta endpoints. Store keys in n8n credentials, never workflow JSON.

Official references:
https://hjelp.conta.no/api/
https://docs.gateway.conta.no/docs/conta-external-api.json

GET endpoints under /accounting/organizations/{opContextOrgId}:
- /reports/trial-balance: opening, movement and closing totals per account.
- /reports/trial-balance/details: ledger lines for the selected account and period.
- /bookkeeping-accounts: validate configured accounts.

Verify schemas, date boundaries, signs and omitted accounts against test data before claiming live support. Sandbox email verification requires contacting Conta support; provide credential-free synthetic fixtures.

## Workflow
1. Validate distinct organizations, dates, currency, account mappings and tolerance (default NOK 0.01).
2. Fetch both trial balances and ledger details for every selected account. Preserve source IDs and retrieval timestamps. Complete any documented paging; never silently cap results.
3. Validate per account: opening + movement = closing; signed detail totals = reported movement. An absent account is not automatically zero.
4. Compute opening difference, period movement difference and closing difference separately.
5. Produce an exception report and supporting ledger export. Re-fetch totals before completion; flag detected changes during retrieval. Never claim an atomic historical snapshot.

## Comparison Rules
Use exact decimal arithmetic or integer øre. Normalize debit-positive/credit-negative, retaining original values. Aggregate only mapped accounts, not organization-wide totals.

Closing residual = signed closing balance A + signed closing balance B. Example: +250000 and -225000 yields NOK 25000. Never compare absolute balances. Show signed residual and magnitude.

Report opening residual + movement residual = closing residual. A pre-existing opening difference must not be described as caused this month.

Optionally suggest one-to-one ledger candidates using a shared invoice reference, opposite equal amounts and a configured date window. Local transaction IDs or voucher numbers are not shared references. Amount/date alone must never confirm a match. Ambiguity, missing references and split settlements remain for review. Retain reversals and corrections according to validated report semantics.

Balance agreement is not proof of transaction completeness. Unmatched lines are not confirmed bookkeeping errors. The accountant approves mappings and conclusions.

## Output and Reliability
Return COMPLETE or INCOMPLETE separately from BALANCES_AGREE or DIFFERENCE. Only evaluate agreement after all required data checks pass. Missing access, invalid scope, failed retrieval, schema changes or inconsistent totals must produce INCOMPLETE, never zero-filled results.

Show companies, period, mappings, tolerance, opening/movement/closing values, residuals, line evidence, candidate reasons and unresolved items. Escape HTML and neutralize CSV formula injection. Bound retries; honor Retry-After. Keep reports private; document data retention.

## Implementation and Release
Use standard n8n HTTP nodes and modular TypeScript compiled/bundled into JavaScript Code nodes. No runtime npm imports, filesystem dependency or separate service. Separate adapters, validation, comparison and report rendering. Test Cloud and self-hosted before claiming compatibility.

Publish original code/template under MIT, fixtures and English setup docs. Norwegian video: "Kontroller mellomværende mellom to selskaper i Conta automatisk". Add a workflow page on bjorvand.ai with download and implementation CTAs. No redesign.

First milestone: two synthetic companies, 20 lines and a NOK 25000 residual. Test opening differences, balanced totals with unresolved lines, missing accounts, duplicate references, reversals, cutoff boundaries and API failure. Match known Conta reports in authorized integration tests; report unrun tests honestly.
