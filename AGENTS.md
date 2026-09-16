# AGENTS.md
Read SPEC.md. Keep changes small and modules focused.
Use TypeScript for deterministic accounting logic; n8n for orchestration. Bundle JavaScript; no runtime npm imports or backend.
Conta access is GET-only. Never post, pay, send emails or expose credentials.
Compare signed closing balances, including opening balances. Use decimal-safe money and preserve source IDs.
Unknown, failed or incomplete data is never zero. Balance agreement is not a completed reconciliation. Flag ambiguity; never infer counterparties or confirm matches from amount alone.
Test fixtures, date boundaries, signs and failure paths. Report unrun tests honestly.
English code/docs; Norwegian reports. Publish synthetic data only.
