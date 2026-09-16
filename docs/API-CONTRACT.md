# Conta API contract and evidence boundary

Schema inspected on 2026-09-16 from the [official OpenAPI document](https://docs.gateway.conta.no/docs/conta-external-api.json). Access guidance: [Conta API help](https://hjelp.conta.no/api/). These references document field names and access requirements; they do not substitute for authorized integration tests.

Base URLs are exactly `https://api.gateway.conta.no` or `https://api.gateway.conta-sandbox.no`. Authentication uses the `apiKey` header from customer-owned n8n Header Auth credentials. The workflow only emits GET requests, never follows redirects and validates each generated request against its configured scope before dispatch.

Under `/accounting/organizations/{opContextOrgId}`:

| Endpoint | Query | Expected response |
| --- | --- | --- |
| `/bookkeeping-accounts` | `hits=0&page=0` | Array of accounts. Select by `bookkeepingAccountNo`; require unique row, `id`, boolean `isActive`. Inactive accounts are not silently discarded. |
| `/reports/trial-balance` | `startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Object with `trialBalanceOutputSub` array; selected rows contain `bookkeepingAccountNo`, `sumIngoing`, `sumChanged`, `sumOutgoing`. |
| `/reports/trial-balance/details` | Same dates plus `bookkeepingAccountNo` | Array of ledger lines: `id`, `transactionId`, `date`, `bookkeepingAccountNo`, `amount`; boolean `isResetTransaction` and `isCorrection` required by this conservative adapter. |

`hits=0` is explicitly documented to return all results. The two report operations expose no pagination parameters in the inspected schema. No guessed page loop or row cap is added. Account omissions are not documented as proof of zero and are always rejected. Organization-wide top-level trial-balance sums are deliberately ignored.

Ledger `amount` is documented as negative for credit and positive for debit. Trial-balance fields are described as balances before the start date, movement in the period, and balance on the end date. The implementation assumes inclusive start/end dates and identical signed semantics; **this must be verified on live report examples before COMPLETE is enabled**. It also requires explicit boolean correction flags even though the schema does not mark all output fields required. If Conta omits these fields, the adapter returns INCOMPLETE until their meaning has been investigated and covered by tests. Do not fill unknown values with zero or false to make a run green.

The HTTP nodes request raw file bytes with full response headers/status, then decode UTF-8 using the n8n binary helper. The locally tested n8n text response mode parsed JSON internally and rounded a 64-bit ID, so text mode must not be substituted. A token-preserving JSON conversion turns numeric tokens into exact strings before they become JavaScript numbers. Arithmetic uses BigInt øre; results are decimal strings. Numeric IDs retain all digits, including 64-bit values. Monetary exponent notation or more than two fractional digits is conservatively rejected, not rounded. The initial syntax-only JSON parse is discarded. Reports preserve selected original ledger fields including transaction identifiers, voucher identifiers, invoice references, amounts and reversal/correction metadata; no arbitrary response fields or HTTP headers are exported.

`invoiceNo` is only a shared-reference candidate after accountant confirmation for the relationship. `invoiceId`, `transactionId`, `transactionNo`, `transactionNoYear`, customer IDs and supplier IDs are local evidence, never common matching keys. `customerOrgNo` and `supplierOrgNo` are not used to infer or authorize account ownership.

Request order: A account list, A initial totals, B account list, B initial totals, each selected A detail account, each selected B detail account, A final totals, B final totals. Per-account arithmetic is exact. Final selected totals must equal initial selected totals. This detects some concurrent changes, but neither freezes the books nor proves transaction completeness. Same-total edits and offsetting additions can be invisible.

Official n8n references: [HTTP Request node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/), [item linking](https://docs.n8n.io/data/data-mapping/data-item-linking/item-linking-code-node/), [execution data](https://docs.n8n.io/hosting/scaling/execution-data/). Local runtime source is inspected when checking generated node parameters; Cloud compatibility is a separate gate.
