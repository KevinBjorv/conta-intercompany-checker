# Conta Intercompany Checker

**Pilot release — not cleared for marketing as a verified live Conta integration.**

Mellomværendekontroll for Conta is a free, MIT-licensed n8n workflow for comparing signed balances between two explicitly authorized Conta companies. It prepares Norwegian HTML, CSV and JSON evidence for an accountant. It does not complete or approve a reconciliation.

The credential-free demo contains two synthetic companies and 20 ledger lines: NOK 15,000 opening residual + NOK 10,000 movement residual = NOK 25,000 closing residual. Nine one-to-one candidates remain suggestions; two lines have no candidate.

## Try the demo

1. Import [`workflows/conta-synthetic-demo.json`](workflows/conta-synthetic-demo.json) into a private n8n instance.
2. Run **Manual demo**. No credentials or network requests are used.
3. Open **Private reports** and download the `html`, `csv` and `json` binary files.

You can also open [`release/demo/rapport.html`](release/demo/rapport.html) directly. The demo is dated August 2026 and deliberately fixed for reproducibility.

A [90-second Norwegian video](release/demo/conta-demonstrasjon.mp4) explains the synthetic result with on-screen text and no audio. It makes the pending live verification explicit.

## Configure a private Conta pilot

Read [SETUP](docs/SETUP.md), [API contract](docs/API-CONTRACT.md) and [live acceptance](docs/LIVE-ACCEPTANCE.md), then import `workflows/conta-intercompany.json`. Both workflows are inactive. The monthly trigger is also disabled.

Supported scope: one bilateral relationship, manually selected dedicated balance-sheet accounts, NOK books and NOK positions, one completed calendar month. Mixed counterparties, currency conversion and other providers are excluded. All requests use GET against three allowlisted endpoint paths. Customer-owned API keys belong in n8n credentials, never in workflow JSON. Conta keys inherit the creating user's privileges; the keys themselves are **not read-only**.

## What the result means

| Data status | Balance status | Meaning |
| --- | --- | --- |
| COMPLETE | BALANCES_AGREE | Required checks passed and the signed closing residual is within tolerance. Accountant review remains required. |
| COMPLETE | DIFFERENCE | Required checks passed and the signed closing residual exceeds tolerance. This does not establish the cause. |
| INCOMPLETE | null | No balance conclusion is permitted. Read the issues; missing and failed data are never zero. |

Amounts use exact integer øre. The workflow validates opening + movement = closing per selected account, compares detail sums to movement, and re-fetches both trial balances after all details. A re-fetch is not an atomic snapshot and cannot detect offsetting changes with unchanged totals.

Candidate suggestions require explicit confirmation that invoice numbers are shared references in this relationship, a unique reference on each side, equal opposite signed amounts, and the configured date window. Corrections, reversals, duplicates and split settlements require review. Local transaction and voucher numbers are never shared references.

## Development

Node 22.18+ (Node 24 is used locally). Only development dependencies are installed; generated Code nodes contain bundled JavaScript and need no runtime npm imports, filesystem access, backend or AI.

```sh
npm ci
npm run check
npm run package
```

Modules: `config` validates scope/dates; `transport` defines the allowlist and lossless JSON/retry handling; `adapter` validates Conta responses; `compare` checks balances; `candidates` proposes review candidates; `report` renders private outputs; `engine` drives the n8n request loop. `scripts/build.mjs` generates the workflows. Edit TypeScript and the generator, then rebuild rather than hand-editing bundled code.

Read [release status](docs/RELEASE-STATUS.md) and the [acceptance matrix](docs/ACCEPTANCE-MATRIX.md) for executed checks and remaining gates. Synthetic tests cannot establish live API semantics or n8n Cloud compatibility. Do not publish real company data, pinned execution data, credentials or private validation evidence.

The source distribution is `release/conta-intercompany-checker-0.1.0.tar.gz`, with `release/SHA256SUMS.txt` and a per-file manifest. It contains original source, tests, documentation and synthetic media only. The repository is [KevinBjorv/conta-intercompany-checker](https://github.com/KevinBjorv/conta-intercompany-checker). Website deployment and live acceptance remain separate gates; see the release status rather than inferring readiness from a public download.
