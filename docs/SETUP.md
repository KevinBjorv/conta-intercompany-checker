# Private pilot setup

## Prerequisites

- An n8n workspace whose operators are authorized to handle both companies' accounting information.
- Two different Conta organization IDs, authorized access and the necessary active production subscriptions. Sandbox access is separate. Sandbox registration currently requires requesting email verification from Conta support; this project does not send that request.
- Customer-owned API credentials. Create an n8n **Header Auth** credential for each company with header name `apiKey`. The same underlying key may access both organizations, but select a credential explicitly for each side. Restrict the credential's allowed domains to the chosen Conta gateway where your n8n version supports this.
- Accountant approval of each dedicated balance-sheet account and a confirmation that all selected positions and both sets of books are NOK. The API responses do not independently establish currency or exclusive counterparty ownership.
- Private baseline reports and the acceptance procedure in `LIVE-ACCEPTANCE.md`.

## Import and configure

1. Import `workflows/conta-intercompany.json`. Keep it inactive while validating.
2. Edit only the object in **Configuration**. Organization IDs and account numbers are strings. Replace `REPLACE_ME`, company labels and account lists. Set `authorized`, `dedicatedToOtherCompany` and `positionsInNok` to true only after verifying them. Accounts must be unique four-digit balance-sheet accounts beginning with 1 or 2. Never use an account shared with another counterparty.
3. Set `environment` to `sandbox` or `production`. There is no custom API URL setting. Redirects are disabled; do not enable them.
4. Set `period` to `YYYY-MM` for a completed calendar month, or `last-completed-month`. The latter uses Europe/Oslo even if the n8n host uses another timezone. Default tolerance is the decimal string `0.01`; it applies only to the final bilateral residual, not internal accounting consistency. Tolerances above NOK 100 are rejected.
5. Keep `sharedInvoiceNumbersConfirmed: false` until invoice-number semantics are verified on both sides. Setting it true enables suggestions, never automatic matches. Date window is an integer from 0 through 31 days.
6. In **Conta GET A** and **Conta GET B**, select the respective Header Auth credentials. Do not add keys to configuration, headers in the workflow, URLs or Code nodes. Do not enable automatic HTTP-node retries: the request loop handles bounded retries and Retry-After.
7. Run **Manual run**. During initial live validation, keep `liveValidation.signsDatesOpeningAndOmissionsVerified: false`. Data can be collected, but the final report intentionally remains INCOMPLETE. For a successful retrieval, **Dispatch request** contains receipts for private comparison. Do not pin these items or export a workflow containing them.
8. Complete `LIVE-ACCEPTANCE.md`. Only then set the live validation boolean and a non-sensitive private evidence identifier in `liveValidation.reference`. This operator attestation is not an independent certification by the software.
9. Run again. Download all three outputs from **Private reports**. Review `completeness` before `agreement`, approve the mapping and investigate exceptions.

CSV text is quoted and potentially executable cells (including signed negative values) receive an apostrophe prefix. This favors safe spreadsheet opening over automatic numeric coercion. Use the JSON decimal strings for exact machine calculations; do not remove prefixes indiscriminately from arbitrary description/reference fields.

## Scheduling and reports

The monthly Schedule Trigger is disabled. After acceptance, set `period` to `last-completed-month`, enable the monthly node and activate the workflow. It runs at 06:00 Europe/Oslo on the first day of each month. Keep runs non-overlapping. For a fixed-period rerun, use manual execution and do not leave a fixed period scheduled.

**Scheduled reports stay in private n8n execution history.** Successful executions are saved so an authorized operator can open the final node and download its reports. A returned INCOMPLETE report is also a successful workflow execution; always inspect the report status. The supplied workflow does not send mail, expose a webhook, or save reports to an external destination. Before scheduling, configure the customer-approved n8n pruning and binary-retention policy, restrict workspace access and verify report retrieval and deletion. Execution history is not a permanent accounting archive; export required evidence to approved private storage before pruning.

## Failures and limits

- INCOMPLETE blocks any balance conclusion. A missing selected account is unknown even if it was inactive or had zero activity.
- The documented account-list request uses `hits=0&page=0` to request all rows. Trial-balance and detail endpoints have no documented paging parameters. Unexpected envelopes, missing fields, non-200 responses and inconsistent totals fail closed. Revalidate if Conta changes this contract.
- Retryable responses: transport failures, 408, 429, 500, 502, 503 and 504; at most three attempts per request. Both delta-seconds and HTTP-date Retry-After are honored. Invalid or greater-than-five-minute waits stop the run instead of retrying too early. Authentication failures and redirects do not retry.
- Request timeout is 30 seconds and workflow timeout is 30 minutes. Host termination, credential setup failures before a node executes, exhausted memory and external runner outages can stop n8n before a final report exists. An absent report is a failed/incomplete run, never a successful zero result. Use n8n execution status as an operational gate.
- Reports and CSVs may be large. No silent record cap is applied. A resource failure requires increasing the private environment's capacity or reducing the explicitly approved account scope, followed by a complete rerun.
- Reference comparison is exact and case-sensitive. References are not inferred from descriptions. Reversals and corrections are retained in detail sums according to report semantics; the initial acceptance must verify those semantics.

## Privacy and retention

Outputs contain company identifiers, descriptions, amounts and source IDs. Keep the workspace and reports private. Workflow settings retain successful execution data for scheduled report retrieval, including raw accounting responses. They disable saved failed/manual executions and execution progress. Waiting executions may still persist data; manual runs remain visible in the editor session; instance logs, backups and binary storage have their own retention settings. Review each explicitly, restrict operator access, avoid debug logging and pinned data, and apply the customer's accounting retention policy. Export required evidence to approved private storage before deleting temporary executions. Never publish live reports or browser screenshots containing live data.

Changing n8n credentials or Conta access requires the customer's administrator. Keys inherit the creator's rights. GET-only here is an application restriction, not an assurance that the credential cannot write elsewhere.
