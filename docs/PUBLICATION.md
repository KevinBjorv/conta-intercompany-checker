# Public pilot publication record

Publication is complete for the synthetic pilot. Full marketing readiness remains unproven because authorized bilateral Conta and n8n Cloud acceptance are unavailable. No live support claim is made.

## Source distribution

- Repository: https://github.com/KevinBjorv/conta-intercompany-checker
- Prerelease: https://github.com/KevinBjorv/conta-intercompany-checker/releases/tag/v0.1.0
- Released source: `c32267a2d2d0da330e950c14ca26ff58d35eadcd`.
- GitHub Actions: https://github.com/KevinBjorv/conta-intercompany-checker/actions/runs/35128769681 — completed successfully for that source.
- All four release assets were downloaded again and compared byte for byte with the tested local artifacts. The prerelease flag was confirmed through GitHub.
- Source archive SHA-256: `af6f7276b40c27b0cfb5bbf1e25a215fa567a9de067cabe642c023af28b4934c`.
- Pilot workflow SHA-256: `639f5f04d726bf5044d75e69dd1db943cc589f8114f44e4c81f7f4baffde5ef9`.
- Synthetic workflow SHA-256: `fc21a3d49b4766eedbeb4c06911fa6a88ddc63ed2da7c00437281672c08d9eca`.

The release assets and source tag are frozen. Later publication documentation does not retroactively alter their contents. The preparation status included in the archive predates website publication; consult the current repository readiness file for publication state, while preserving the same live-validation limitations.

## Website

- Norwegian: https://bjorvand.ai/workflows/conta-intercompany-checker
- English: https://bjorvand.ai/en/workflows/conta-intercompany-checker
- Reviewed PR: https://github.com/KevinBjorv/bjorvand-ai/pull/1 — merged.
- Website source: `1f224c796aeb55afb4f447bd3388be0b81fdec36`.
- Current production deployment: `dpl_A4Prcg9tgiGcE8bF4Aige4jKJoCw`.
- Deployment URL: https://bjorvand-58nwp16bp-bjorv.vercel.app
- Vercel confirmed READY, production target, matching Git SHA, `gitDirty=0` and the `bjorvand.ai`/`www.bjorvand.ai` aliases.
- The previous production source was verified as `b721c74ef64357529b47c0723e2553fda6747d85` before publishing the isolated additive change. Unrelated local edits were excluded.
- Both published language pages were observed in the browser with correct pilot limitations and locale-specific booking links. A production browser download of the synthetic workflow matched SHA-256 `fc21a3d49b4766eedbeb4c06911fa6a88ddc63ed2da7c00437281672c08d9eca`.
- The setup modal opens. Its embedded calendar remained loading during the checks; both direct fallback Cal.com event pages loaded. No booking was submitted and no complete booking journey is claimed.

## What remains unverified

Two authorized Conta organizations, approved dedicated NOK account mappings, comparison with known Conta reports, n8n Cloud execution and customer production schedule/pruning-policy acceptance. A subsequent local Schedule Trigger test and saved-report retrieval passed on 2026-09-17 with synthetic data; see `release/n8n-schedule-results.json`. This adds local evidence without replacing the remaining live and Cloud gates.
