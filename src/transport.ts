import type { Request, Scope, Side } from './types.ts';

// Quote numeric JSON tokens before parsing, preserving 64-bit IDs and exact decimals.
export function parseContaJson(text: unknown): unknown {
  if (typeof text !== 'string') throw new Error('Conta-svaret må hentes som tekst for å bevare beløp og ID-er.');
  try { JSON.parse(text); } catch { throw new Error('Conta returnerte ugyldig JSON.'); }
  const protectedNumbers = text.replace(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    token => token.startsWith('"') ? token : JSON.stringify(token));
  return JSON.parse(protectedNumbers);
}
export function requestPlan(scope: Scope): Request[] {
  const root = scope.config.environment === 'production' ? 'https://api.gateway.conta.no' : 'https://api.gateway.conta-sandbox.no';
  const requests: Request[] = [];
  const add = (side: Side, kind: Request['kind'], account?: string) => {
    const base = `${root}/accounting/organizations/${scope.config.companies[side].organizationId}`;
    const dates = `startDate=${scope.startDate}&endDate=${scope.endDate}`;
    const path = kind === 'accounts' ? '/bookkeeping-accounts?hits=0&page=0'
      : kind === 'details' ? `/reports/trial-balance/details?${dates}&bookkeepingAccountNo=${account}`
      : `/reports/trial-balance?${dates}`;
    requests.push({ side, kind, ...(account ? { account } : {}), key: `${side}:${kind}${account ? ':' + account : ''}`, url: base + path });
  };
  for (const side of ['A', 'B'] as const) { add(side, 'accounts'); add(side, 'before'); }
  for (const side of ['A', 'B'] as const) for (const a of scope.config.companies[side].accounts) add(side, 'details', a.number);
  for (const side of ['A', 'B'] as const) add(side, 'after');
  return requests;
}
export function assertAllowed(request: Request, scope: Scope): void {
  const expected = requestPlan(scope).find(r => r.key === request.key);
  if (!expected || JSON.stringify(expected) !== JSON.stringify(request)) throw new Error('Forespørselen er ikke tillatt.');
}
export function retryDelay(status: number, retryAfter: unknown, attempt: number, now: number): number | null {
  if (![0, 408, 429, 500, 502, 503, 504].includes(status) || attempt >= 3) return null;
  let delay = 2 ** attempt;
  if (retryAfter !== undefined) {
    if (typeof retryAfter !== 'string') return null;
    if (/^\d+$/.test(retryAfter)) delay = Math.max(delay, Number(retryAfter));
    else {
      const at = Date.parse(retryAfter);
      if (!Number.isFinite(at)) return null;
      delay = Math.max(delay, Math.ceil((at - now) / 1000));
    }
  }
  // An excessive Retry-After stops the run, never retries sooner than requested.
  return delay <= 300 ? delay : null;
}
