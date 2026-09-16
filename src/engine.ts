import { scopeFor } from './config.ts';
import { compare, emptyReport } from './compare.ts';
import { assertAllowed, parseContaJson, requestPlan, retryDelay } from './transport.ts';
import type { Receipt, Report, Request, Scope } from './types.ts';

export interface RunState {
  scope: Scope | null; plan: Request[]; index: number; attempt: number;
  receipts: Receipt[]; report?: Report; waitUntil?: number;
  route: 'A' | 'B' | 'WAIT' | 'DONE'; request?: Request; waitSeconds?: number;
}
export function initialize(config: unknown, now: Date): RunState {
  try {
    const scope = scopeFor(config, now);
    return { scope, plan: requestPlan(scope), index: 0, attempt: 1, receipts: [], route: 'A' };
  } catch (error) {
    const report = emptyReport(null, now.toISOString());
    report.issues.push(error instanceof TypeError ? 'Konfigurasjonen har ugyldig struktur.' : error instanceof Error ? error.message : 'Ugyldig konfigurasjon.');
    return { scope: null, plan: [], index: 0, attempt: 1, receipts: [], route: 'DONE', report };
  }
}
export function dispatch(state: RunState, now: Date): RunState {
  if (state.report) return { ...state, route: 'DONE' };
  if (!state.scope) throw new Error('Mangler validert omfang.');
  if (state.waitUntil && state.waitUntil > now.getTime()) return { ...state, route: 'WAIT', waitSeconds: Math.max(1, Math.ceil((state.waitUntil - now.getTime()) / 1000)) };
  if (state.index >= state.plan.length) return { ...state, route: 'DONE', report: compare(state.scope, state.receipts, now) };
  const request = state.plan[state.index]!;
  assertAllowed(request, state.scope);
  return { ...state, waitUntil: undefined, waitSeconds: undefined, route: request.side, request };
}
export function accept(state: RunState, response: unknown, now: Date): RunState {
  if (!state.scope || !state.request) throw new Error('Svar uten en validert forespørsel.');
  assertAllowed(state.request, state.scope);
  const value = response && typeof response === 'object' ? response as Record<string, unknown> : {};
  const status = typeof value.statusCode === 'number' && Number.isInteger(value.statusCode) ? value.statusCode : 0;
  const headers = value.headers && typeof value.headers === 'object' ? value.headers as Record<string, unknown> : {};
  if (status !== 200) {
    const retryAfter = Object.entries(headers).find(([key]) => key.toLowerCase() === 'retry-after')?.[1];
    const delay = retryDelay(status, retryAfter, state.attempt, now.getTime());
    if (delay !== null) return { ...state, attempt: state.attempt + 1, waitUntil: now.getTime() + delay * 1000, route: 'WAIT', waitSeconds: delay };
  }
  const receipt: Receipt = { request: state.request, retrievedAt: now.toISOString(), status };
  try {
    if (status !== 200) throw new Error('Forespørselen mislyktes.');
    // No raw errors, response headers or credential material are forwarded.
    receipt.body = parseContaJson(value.body);
  } catch {
    receipt.failure = 'Innhenting eller lesing av svaret mislyktes.';
  }
  const next = { ...state, receipts: [...state.receipts, receipt], index: state.index + 1, attempt: 1, waitUntil: undefined };
  if (receipt.failure) {
    const report = emptyReport(state.scope, now.toISOString());
    report.issues.push(`${receipt.request.key}: ${receipt.failure} HTTP ${status || 'ukjent'}.`);
    report.sources = next.receipts.map(r => ({ key: r.request.key, url: r.request.url, status: r.status, retrievedAt: r.retrievedAt }));
    return { ...next, report, route: 'DONE' };
  }
  return next;
}
