import test from 'node:test';
import assert from 'node:assert/strict';
import { demoConfig, demoFixture, demoTime } from '../fixtures/synthetic.ts';
import { scopeFor, validDate } from '../src/config.ts';
import { compare } from '../src/compare.ts';
import { suggest } from '../src/candidates.ts';
import { abs, decimal, nok, ore } from '../src/money.ts';
import { accept, dispatch, initialize } from '../src/engine.ts';
import { assertAllowed, parseContaJson, requestPlan, retryDelay } from '../src/transport.ts';
import { csvCell, render } from '../src/report.ts';
import type { Receipt } from '../src/types.ts';

const setup = () => { const f = demoFixture(); return { ...f, scope: scopeFor(f.config, demoTime) }; };
const run = (f = setup(), synthetic = true) => compare(f.scope, f.receipts, demoTime, synthetic);
const rows = (f: ReturnType<typeof setup>, key: string) => f.receipts.find(r => r.request.key === key)!.body as Record<string, unknown>[];
const balance = (f: ReturnType<typeof setup>, side: string, kind = 'before') => (f.receipts.find(r => r.request.key === `${side}:${kind}`)!.body as { trialBalanceOutputSub: Record<string, unknown>[] }).trialBalanceOutputSub[0]!;
const incomplete = (f: ReturnType<typeof setup>) => { const r = run(f); assert.equal(r.completeness, 'INCOMPLETE'); assert.equal(r.agreement, null); assert.equal(r.residual, null); return r; };

test('20-line acceptance: signed 25,000 residual is 15,000 opening + 10,000 movement', () => {
  const r = run();
  assert.equal(r.completeness, 'COMPLETE'); assert.equal(r.agreement, 'DIFFERENCE');
  assert.deepEqual(r.residual, { opening: '15000.00', movement: '10000.00', closing: '25000.00', magnitude: '25000.00' });
  assert.equal(r.lines.length, 20); assert.equal(r.candidates.length, 9); assert.equal(r.unresolved.length, 2);
  assert.equal(r.totals!.A.closing, '250000.00'); assert.equal(r.totals!.B.closing, '-225000.00');
});
test('integer øre arithmetic is exact, including large aggregates and negatives', () => {
  assert.equal(decimal(ore('0.10') + ore('0.20')), '0.30'); assert.equal(decimal(ore('-0.01')), '-0.01');
  assert.equal(decimal(ore('99999999999.99') * 100n), '9999999999999.00'); assert.equal(abs(-1n), 1n);
  assert.equal(nok('-25000.00'), '-25 000,00');
  for (const v of [null, undefined, 0, 0.1, '', 'NaN', '1e2', '1,00', '1.001', '01', '+2', ' 2']) assert.throws(() => ore(v));
});
test('lossless raw JSON retains 64-bit source IDs and decimal tokens', () => {
  const parsed = parseContaJson('{"id":9223372036854775807,"amount":-99999999999.99,"text":"x \\\" 123","ok":true}');
  assert.deepEqual(parsed, { id: '9223372036854775807', amount: '-99999999999.99', text: 'x " 123', ok: true });
  for (const v of [{ id: 1 }, '', '[1,]', '{"a":NaN}']) assert.throws(() => parseContaJson(v));
});
test('calendar boundaries use Europe/Oslo including leap year and January rollover', () => {
  const c = demoConfig(); c.period = '2024-02';
  assert.equal(scopeFor(c, demoTime).endDate, '2024-02-29');
  c.period = 'last-completed-month';
  assert.equal(scopeFor(c, new Date('2026-01-15Z')).startDate, '2025-12-01');
  assert.equal(scopeFor(c, new Date('2026-08-31T22:30:00Z')).startDate, '2026-08-01');
  assert.equal(validDate('2026-02-29'), false); assert.equal(validDate('2024-02-29'), true);
});
for (const period of ['2026-09', '2026-13', '2026-00', '2026-08-01', '2027-01', '1999-01']) test(`invalid/current/future period rejected: ${period}`, () => {
  const c = demoConfig(); c.period = period; assert.throws(() => scopeFor(c, demoTime));
});
test('scope rejects mixed accounts, foreign currency, unsafe IDs, duplicate and P&L accounts', () => {
  const changes: ((c: ReturnType<typeof demoConfig>) => void)[] = [
    c => { c.companies.B.organizationId = c.companies.A.organizationId; },
    c => { c.companies.A.organizationId = '156/../../x'; },
    c => { c.companies.A.authorized = false; },
    c => { c.companies.A.accounts[0]!.dedicatedToOtherCompany = false; },
    c => { c.companies.A.accounts[0]!.positionsInNok = false; },
    c => { c.companies.A.accounts[0]!.number = '3000'; },
    c => { c.companies.A.accounts.push(c.companies.A.accounts[0]!); },
    c => { c.companies.A.accounts = []; }, c => { c.tolerance = '-0.01'; }, c => { c.tolerance = '100.01'; },
    c => { c.candidateDateWindowDays = 1.2; },
  ];
  for (const change of changes) { const c = demoConfig(); change(c); assert.throws(() => scopeFor(c, demoTime)); }
});
test('live support is gated on a documented report validation reference', () => {
  const f = setup(); assert.equal(run(f, false).completeness, 'INCOMPLETE');
  f.scope.config.liveValidation = { reference: 'Private test evidence 001', signsDatesOpeningAndOmissionsVerified: true };
  assert.equal(run(f, false).completeness, 'COMPLETE');
});
test('absent account never becomes zero even with empty details', () => {
  const f = setup(); (f.receipts.find(r => r.request.key === 'A:before')!.body as any).trialBalanceOutputSub = [];
  assert.match(incomplete(f).issues[0]!, /Fravær er ikke null/);
});
test('account missing from account list blocks completion', () => { const f = setup(); f.receipts.find(r => r.request.key === 'B:accounts')!.body = []; incomplete(f); });
test('duplicate account rows are ambiguous', () => { const f = setup(); rows(f, 'A:accounts').push(rows(f, 'A:accounts')[0]!); incomplete(f); });
test('opening plus movement must exactly equal closing, independent of tolerance', () => { const f = setup(); balance(f, 'A').sumOutgoing = '250000.01'; incomplete(f); });
test('detail totals must exactly equal reported movement', () => { const f = setup(); rows(f, 'A:details:1560')[0]!.amount = '15000.01'; incomplete(f); });
test('refetch detects selected account changes', () => { const f = setup(); Object.assign(balance(f, 'A', 'after'), { sumChanged: '150001.00', sumOutgoing: '250001.00' }); incomplete(f); });
test('source line duplicates are rejected', () => { const f = setup(); rows(f, 'A:details:1560')[1]!.id = rows(f, 'A:details:1560')[0]!.id; incomplete(f); });
for (const date of ['2026-07-31', '2026-09-01', '2026-08-32']) test(`out-of-cutoff or invalid ledger date ${date}`, () => { const f = setup(); rows(f, 'A:details:1560')[0]!.date = date; incomplete(f); });
test('both inclusive month edges are retained', () => { const r = run(); assert.equal(r.lines[0]!.date, '2026-08-01'); assert.equal(r.lines[9]!.date, '2026-08-31'); });
test('foreign-account details cannot contaminate the mapped accounts', () => { const f = setup(); rows(f, 'A:details:1560')[0]!.bookkeepingAccountNo = '1920'; incomplete(f); });
test('same-sign balances do not falsely agree by magnitude', () => {
  const f = setup(); for (const k of ['before', 'after']) Object.assign(balance(f, 'B', k), { sumIngoing: '100000.00', sumChanged: '150000.00', sumOutgoing: '250000.00' });
  for (const l of rows(f, 'B:details:2960')) l.amount = '15000.00';
  assert.equal(run(f).residual!.closing, '500000.00');
});
test('balanced totals can have unresolved lines; tolerance applies only to residual', () => {
  const f = setup(); for (const k of ['before', 'after']) Object.assign(balance(f, 'B', k), { sumIngoing: '-109999.99', sumOutgoing: '-249999.99' });
  const r = run(f); assert.equal(r.agreement, 'BALANCES_AGREE'); assert.equal(r.residual!.closing, '0.01'); assert.equal(r.unresolved.length, 2);
  f.scope.config.tolerance = '0.00'; assert.equal(run(f).agreement, 'DIFFERENCE');
});
test('corrections and reversals stay in totals and require review', () => {
  const f = setup(); rows(f, 'A:details:1560')[0]!.isResetTransaction = true;
  const r = run(f); assert.equal(r.residual!.closing, '25000.00'); assert.equal(r.candidates.length, 8);
  assert.match(r.unresolved.find(l => l.lineId === '1000')!.reason, /Reversering/);
});
test('duplicate reference blocks all related candidates, including split settlements', () => {
  const f = setup(); rows(f, 'A:details:1560')[1]!.invoiceNo = 'DEMO-1';
  const r = run(f); assert.equal(r.candidates.length, 7); assert.match(r.unresolved.find(l => l.lineId === '1000')!.reason, /Tvetydig/);
});
test('amount/date and local transaction IDs are never shared references', () => {
  const f = setup(); for (const rec of f.receipts.filter(r => r.request.kind === 'details')) for (const line of rec.body as any[]) delete line.invoiceNo;
  assert.equal(run(f).candidates.length, 0); assert.equal(run(f).unresolved.length, 20);
});
test('unconfirmed shared-invoice semantics disables candidates', () => { const f = setup(); f.scope.config.sharedInvoiceNumbersConfirmed = false; assert.equal(run(f).candidates.length, 0); });
test('date window is inclusive and shared references alone do not match amounts', () => {
  const r = run(); r.lines[10]!.date = '2026-08-04'; assert.equal(suggest(r.lines, r.scope!.config).candidates.length, 9);
  r.lines[10]!.date = '2026-08-05'; assert.equal(suggest(r.lines, r.scope!.config).candidates.length, 8);
});
for (const status of [0, 401, 403, 404, 429, 500]) test(`failed HTTP ${status} never agrees`, () => { const f = setup(); f.receipts[0]!.status = status; incomplete(f); });
test('truncated response sets, unordered receipts and bad timestamps block completion', () => {
  let f = setup(); f.receipts.pop(); incomplete(f);
  f = setup(); f.receipts.reverse(); incomplete(f);
  f = setup(); f.receipts[0]!.retrievedAt = 'unknown'; incomplete(f);
});
test('malformed response schemas and missing amounts cannot zero-fill', () => {
  const bads: unknown[] = [null, {}, { items: [] }, ''];
  for (const bad of bads) { const f = setup(); f.receipts.find(r => r.request.kind === 'details')!.body = bad; incomplete(f); }
  const f = setup(); delete rows(f, 'A:details:1560')[0]!.amount; incomplete(f);
});
test('retries are bounded and honor seconds/date Retry-After without shortening', () => {
  assert.equal(retryDelay(429, '12', 1, 0), 12); assert.equal(retryDelay(503, new Date(20000).toUTCString(), 1, 0), 20);
  assert.equal(retryDelay(429, '301', 1, 0), null); assert.equal(retryDelay(429, 'bad', 1, 0), null);
  assert.equal(retryDelay(500, undefined, 3, 0), null); assert.equal(retryDelay(403, undefined, 1, 0), null);
});
test('request plan is GET allowlist compatible, asks for all accounts, refetches after all details', () => {
  const f = setup(), plan = requestPlan(f.scope);
  assert.ok(plan[0]!.url.endsWith('/bookkeeping-accounts?hits=0&page=0'));
  assert.deepEqual(plan.slice(-2).map(p => p.kind), ['after', 'after']);
  for (const r of plan) assertAllowed(r, f.scope);
  assert.throws(() => assertAllowed({ ...plan[0]!, url: 'https://example.com' }, f.scope));
});
test('state machine preserves request context and fails safely after retry exhaustion', () => {
  let s = dispatch(initialize(demoConfig(), demoTime), demoTime);
  for (let i = 0; i < 3; i++) { s = accept(s, { statusCode: 429, headers: { 'Retry-After': '3' }, body: 'DO NOT EXPOSE' }, demoTime); if (!s.report) s = dispatch(s, new Date(demoTime.getTime() + 4000)); }
  assert.equal(s.report!.completeness, 'INCOMPLETE'); assert.ok(!JSON.stringify(s.report).includes('DO NOT EXPOSE'));
});
test('state machine parses raw successful replies and reaches live verification gate', () => {
  const f = setup(); let s = initialize(f.config, demoTime);
  for (const r of f.receipts) { s = dispatch(s, demoTime); s = accept(s, { statusCode: 200, body: JSON.stringify(r.body) }, demoTime); }
  s = dispatch(s, demoTime); assert.equal(s.route, 'DONE'); assert.match(s.report!.issues[0]!, /ikke verifisert/);
});
test('invalid configuration yields an INCOMPLETE report before any request', () => { const s = initialize(null, demoTime); assert.equal(s.report!.completeness, 'INCOMPLETE'); assert.equal(s.plan.length, 0); });
test('HTML escapes hostile evidence; CSV neutralizes formulas; Norwegian stays UTF-8', () => {
  const f = setup(); f.scope.config.companies.A.name = '<img src=x onerror=alert(1)>'; rows(f, 'A:details:1560')[0]!.description = '=HYPERLINK("https://evil")';
  const output = render(run(f)); assert.ok(!output.html.includes('<img')); assert.ok(output.html.includes('&lt;img'));
  assert.ok(output.html.includes('Mellomværendekontroll')); assert.ok(output.csv.includes("'=HYPERLINK"));
  for (const s of ['=1', '+1', '-1', '@SUM(1)', '  =1', '\t=1', '\n=1', '\ufeff=1']) assert.ok(csvCell(s).startsWith('"\''));
});

test('multiple mapped accounts are all retrieved and aggregated without organization totals', () => {
  const f = setup();
  f.scope.config.companies.A.accounts.push({ number: '1570', dedicatedToOtherCompany: true, positionsInNok: true });
  rows(f, 'A:accounts').push({ id: '11', bookkeepingAccountNo: '1570', isActive: false });
  for (const k of ['before', 'after']) (f.receipts.find(r => r.request.key === `A:${k}`)!.body as any).trialBalanceOutputSub.push({ bookkeepingAccountNo: '1570', sumIngoing: '1.00', sumChanged: '2.00', sumOutgoing: '3.00' });
  const plan = requestPlan(f.scope);
  const byKey = new Map(f.receipts.map(r => [r.request.key, r]));
  f.receipts = plan.map((request, index) => ({ ...(byKey.get(request.key) ?? { status: 200, body: [{ id: '3000', transactionId: '30000', date: '2026-08-01', bookkeepingAccountNo: '1570', amount: '2.00', isResetTransaction: false, isCorrection: false }] }), request, retrievedAt: new Date(demoTime.getTime() - (20 - index) * 1000).toISOString() })) as Receipt[];
  const r = run(f); assert.equal(r.completeness, 'COMPLETE'); assert.equal(r.residual!.closing, '25003.00');
  assert.equal(r.accounts.find(a => a.account === '1570')!.accountId, '11');
  assert.deepEqual(r.accounts.find(a => a.account === '1570')!.original, { sumIngoing: '1.00', sumChanged: '2.00', sumOutgoing: '3.00' });
});
test('explicit zero account with empty details is valid; missing zero account is not', () => {
  const f = setup();
  for (const side of ['A', 'B']) for (const kind of ['before', 'after']) Object.assign(balance(f, side, kind), { sumIngoing: '0', sumChanged: '0.00', sumOutgoing: '-0.00' });
  for (const r of f.receipts.filter(r => r.request.kind === 'details')) r.body = [];
  const r = run(f); assert.equal(r.completeness, 'COMPLETE'); assert.equal(r.agreement, 'BALANCES_AGREE'); assert.equal(r.lines.length, 0);
  assert.equal(r.accounts[0]!.original.sumOutgoing, '-0.00');
});
test('changing numeric formatting alone between fetches is not a balance change', () => {
  const f = setup(); balance(f, 'A', 'after').sumIngoing = '100000'; assert.equal(run(f).completeness, 'COMPLETE');
});
