# Authorized live acceptance procedure

Status: **NOT RUN**. Verification requires two explicitly authorized Conta companies with dedicated accounts, known reports and n8n test environments. These prerequisites are not yet available for this pilot. No substitute accounts, fixtures posted into Conta, guessed mappings or production writes are permitted.

Keep the checklist and all live source reports in customer-approved private storage, outside this public release. Record the workflow SHA-256, software and n8n versions, environment, accountant/reviewer, UTC retrieval times, company IDs, approved dedicated accounts, NOK attestations and exact completed month. Store a non-sensitive evidence reference in configuration after approval; do not put private documents in Git.

## Conta semantics and accuracy

1. Establish explicit authorization for two different organizations and each credential. Confirm active subscriptions where applicable and prove GET access to all three endpoint paths.
2. Obtain known trial balances and ledger reports directly from Conta for the same month/accounts. Record opening, movement and closing per account independently of this checker.
3. Include positive debit and negative credit balances, nonzero opening balances, an existing opening mismatch, first/last-day entries, a leap-February or year boundary, and corrections/reversals. Prove whether the detail report retains corrections and how this agrees with trial-balance movement. Do not create or modify accounting entries through this tool.
4. Confirm absent versus explicit-zero selected accounts. Check a populated account list above the default 20-row page size; prove `hits=0` includes the expected selected account. Confirm complete details against the direct report; equal sums alone do not prove line completeness.
5. Compare source IDs and values, exact signs, inclusive dates and all per-account identities. Independently recompute signed A+B opening/movement/closing residuals. Explain differences without assigning causation from the amount alone.
6. Verify a balanced case with unresolved transactions, repeated invoice references, split settlements and entries with no shared reference. Candidate status never means confirmed or approved.
7. Confirm the selected account totals are re-fetched after both organizations' detail retrieval. Exercise a controlled concurrent-change fixture in the test harness; do not change live books merely to test this.
8. Record failure evidence for missing access, missing selected accounts and provider errors. A failed/incomplete run must not show BALANCES_AGREE or substitute zeros.

## n8n Cloud and self-hosted

Run separately on the exact versions customers will use. Import both workflows. Execute the synthetic demo and verify all three downloads, UTF-8 Norwegian, 20 rows, signed NOK 25,000 closing residual, NOK 15,000 opening residual and nine candidates.

In a private test copy exercise both credential branches, multiple selected accounts, item linking over repeated loop iterations, a retryable HTTP status with Retry-After seconds/date, exhausted retries, transport timeout, auth failure, redirects, malformed text, large IDs and inconsistent data. Record execution success/failure and final report status separately. The shipped workflow is not allowed to point at a mock host; use a clearly separated development harness.

For scheduling, verify timezone/month selection and the approved private storage/retention route before enabling the trigger. Test the actual scheduled activation, retrieval and deletion procedure in both environments. A simulated schedule or a local Code-node run is not equivalent to Cloud acceptance.

## Reproducing the local runtime evidence

The recorded local test uses Node 24.13.1 and an isolated n8n 2.39.6 installation at `.qa/runtime/node_modules/n8n`. Run `node scripts/n8n-smoke.mjs` from the repository root with localhost ports 5688 and 5689 free. Each run creates a fresh `.qa/smoke-<timestamp>` directory with synthetic credentials, inactive workflow copies and private logs. Requests stay on a loopback fixture server; the shipped Conta endpoint allowlist is unchanged. The timeout case uses the original 30-second setting and three attempts. A four-minute bound applies to each CLI command; a failed check stops the suite without writing a new passing result record.

All 17 local scenarios passed on 2026-09-17; `release/n8n-smoke-results.json` identifies the exact workflow hashes and separates workflow execution success from COMPLETE/INCOMPLETE report status. The multiple-account case adds two synthetic accounts and lines, producing a deliberately different NOK 25,001 residual. The original public demo remains 20 lines and NOK 25,000. See `RETENTION.md` for the separate scheduled-run and automatic-pruning tests. None of these local checks establishes Conta or Cloud acceptance.

## Exit criteria

An accountant approves mapping and semantic evidence; both deployment environments pass; public downloads contain only synthetic material; CI is green; the website download and implementation CTA work; a Norwegian demonstration is recorded with synthetic data; marketing copy says balance comparison/evidence preparation rather than completed reconciliation. Only then remove the pilot label and sign the release readiness record.
