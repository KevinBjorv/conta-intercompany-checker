import { balances, ledger, validateAccounts } from './adapter.ts';
import { suggest } from './candidates.ts';
import { abs, decimal, ore } from './money.ts';
import { requestPlan } from './transport.ts';
import type { Balance, Receipt, Report, Scope, Side } from './types.ts';

export function emptyReport(scope: Scope | null, generatedAt: string, synthetic = false): Report {
  return { version: '0.1.0', synthetic, generatedAt, completeness: 'INCOMPLETE', agreement: null,
    scope, issues: [], accounts: [], totals: null, residual: null, lines: [], candidates: [], unresolved: [], sources: [] };
}
export function compare(scope: Scope, receipts: Receipt[], now: Date, synthetic = false): Report {
  const report = emptyReport(scope, now.toISOString(), synthetic);
  try {
    const plan = requestPlan(scope);
    if (receipts.length !== plan.length) throw new Error('Datainnhentingen er ufullstendig eller inneholder ekstra svar.');
    let lastTime = -Infinity;
    for (let i = 0; i < plan.length; i++) {
      const r = receipts[i]!;
      if (JSON.stringify(r.request) !== JSON.stringify(plan[i])) throw new Error('Kildesvar har feil rekkefølge eller omfang.');
      const time = Date.parse(r.retrievedAt);
      if (!Number.isFinite(time) || time < lastTime || time > now.getTime()) throw new Error('Ugyldig tidsstempel for datainnhenting.');
      lastTime = time;
      report.sources.push({ key: r.request.key, url: r.request.url, retrievedAt: r.retrievedAt, status: r.status });
      if (r.status !== 200 || r.failure || r.body === undefined) throw new Error(`${r.request.key}: Innhenting mislyktes (HTTP ${r.status || 'ukjent'}).`);
    }
    for (const side of ['A', 'B'] as const) {
      const get = (kind: Receipt['request']['kind']) => receipts.find(r => r.request.side === side && r.request.kind === kind)!;
      const accountIds = validateAccounts(get('accounts').body, scope, side);
      const before = balances(get('before').body, scope, side);
      const after = balances(get('after').body, scope, side);
      const values = (list: typeof before) => list.map(({ original: _original, ...balance }) => balance);
      if (JSON.stringify(values(before)) !== JSON.stringify(values(after))) throw new Error(`${side}: Saldoene endret seg under innhenting. Kjør kontrollen på nytt.`);
      const lines = receipts.filter(r => r.request.side === side && r.request.kind === 'details').flatMap(r => ledger(r, scope));
      const ids = new Set<string>();
      for (const l of lines) {
        if (ids.has(l.id)) throw new Error(`${side}: Gjentatt kildelinje-ID ${l.id}.`);
        ids.add(l.id);
      }
      for (const balance of before) {
        const sum = lines.filter(l => l.account === balance.account).reduce((n, l) => n + ore(l.amount), 0n);
        if (sum !== ore(balance.movement)) throw new Error(`${side}: Detaljlinjene stemmer ikke med periodens bevegelse på konto ${balance.account}.`);
      }
      report.accounts.push(...before.map(a => ({ ...a, accountId: accountIds[a.account]! })));
      report.lines.push(...lines);
    }
    if (!synthetic && (!scope.config.liveValidation.signsDatesOpeningAndOmissionsVerified || !scope.config.liveValidation.reference.trim())) {
      throw new Error('Fortegn, datoavgrensning, inngående saldo og utelatte kontoer er ikke verifisert mot autoriserte Conta-rapporter.');
    }
    const total = (side: Side): Balance => Object.fromEntries((['opening', 'movement', 'closing'] as const).map(k => [k,
      decimal(report.accounts.filter(a => a.side === side).reduce((n, a) => n + ore(a[k]), 0n))])) as unknown as Balance;
    report.totals = { A: total('A'), B: total('B') };
    const residual = Object.fromEntries((['opening', 'movement', 'closing'] as const).map(k => [k,
      decimal(ore(report.totals!.A[k]) + ore(report.totals!.B[k]))])) as unknown as Balance;
    report.residual = { ...residual, magnitude: decimal(abs(ore(residual.closing))) };
    Object.assign(report, suggest(report.lines, scope.config));
    report.completeness = 'COMPLETE';
    report.agreement = abs(ore(residual.closing)) <= ore(scope.config.tolerance) ? 'BALANCES_AGREE' : 'DIFFERENCE';
  } catch (error) {
    report.issues.push(error instanceof Error ? error.message : 'Kontrollen kunne ikke fullføres.');
    // Never present partially aggregated balances as a valid comparison.
    report.accounts = []; report.totals = null; report.residual = null;
    report.unresolved = report.lines.map(l => ({ side: l.side, lineId: l.id, reason: 'Ufullstendig kontroll. Linjen er ikke vurdert.' }));
  }
  return report;
}
