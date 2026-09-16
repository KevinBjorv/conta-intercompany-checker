import { ore } from './money.ts';
import type { Config, Scope } from './types.ts';

export function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function scopeFor(input: unknown, now: Date): Scope {
  if (!input || typeof input !== 'object') throw new Error('Konfigurasjonen mangler.');
  const c = input as Config;
  if (!['sandbox', 'production'].includes(c.environment)) throw new Error('Ugyldig Conta-miljø.');
  if (!Number.isFinite(now.getTime())) throw new Error('Ugyldig kjøringstidspunkt.');
  const oslo = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (name: string) => oslo.find(p => p.type === name)!.value;
  const currentMonth = `${part('year')}-${part('month')}`;
  let month = c.period;
  if (month === 'last-completed-month') {
    const date = new Date(`${currentMonth}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - 1);
    month = date.toISOString().slice(0, 7);
  }
  if (typeof month !== 'string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month) || month >= currentMonth) {
    throw new Error('Velg én avsluttet kalendermåned (YYYY-MM).');
  }
  const startDate = `${month}-01`;
  const end = new Date(`${startDate}T12:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  const tolerance = ore(c.tolerance);
  if (tolerance < 0n || tolerance > 10000n) throw new Error('Toleranse må være mellom 0 og 100 NOK.');
  for (const side of ['A', 'B'] as const) {
    const company = c.companies?.[side];
    if (!company || !/^[1-9]\d{0,18}$/.test(company.organizationId) || typeof company.organizationId !== 'string'
      || typeof company.name !== 'string' || !company.name.trim() || company.name.length > 200) throw new Error(`Ugyldig selskap ${side}.`);
    if (company.authorized !== true || company.currency !== 'NOK') throw new Error(`Selskap ${side} må være autorisert og føre regnskap i NOK.`);
    if (!Array.isArray(company.accounts) || !company.accounts.length) throw new Error(`Kontovalg mangler for ${side}.`);
    const seen = new Set<string>();
    for (const account of company.accounts) {
      if (!account || typeof account.number !== 'string' || !/^[12]\d{3}$/.test(account.number) || seen.has(account.number)) throw new Error(`Ugyldig eller gjentatt balansekonto for ${side}.`);
      if (account.dedicatedToOtherCompany !== true || account.positionsInNok !== true) throw new Error(`Konto ${account.number} må kun gjelde motparten og posisjoner i NOK.`);
      seen.add(account.number);
    }
  }
  if (c.companies.A.organizationId === c.companies.B.organizationId) throw new Error('Selskapene må ha ulike organisasjons-ID-er.');
  if (typeof c.sharedInvoiceNumbersConfirmed !== 'boolean' || !Number.isInteger(c.candidateDateWindowDays)
    || c.candidateDateWindowDays < 0 || c.candidateDateWindowDays > 31) throw new Error('Ugyldige regler for kandidatforslag.');
  if (!c.liveValidation || typeof c.liveValidation.reference !== 'string' || typeof c.liveValidation.signsDatesOpeningAndOmissionsVerified !== 'boolean') throw new Error('Angi status for kontroll mot Conta-rapporter.');
  // Copy only the documented config fields; no accidental credentials in report output.
  const clean: Config = {
    environment: c.environment, period: month, tolerance: c.tolerance,
    companies: Object.fromEntries((['A', 'B'] as const).map(side => [side, {
      organizationId: c.companies[side].organizationId, name: c.companies[side].name,
      authorized: true, currency: 'NOK', accounts: c.companies[side].accounts.map(a => ({ number: a.number, dedicatedToOtherCompany: true, positionsInNok: true })),
    }])) as Config['companies'],
    sharedInvoiceNumbersConfirmed: c.sharedInvoiceNumbersConfirmed, candidateDateWindowDays: c.candidateDateWindowDays,
    liveValidation: { reference: c.liveValidation.reference, signsDatesOpeningAndOmissionsVerified: c.liveValidation.signsDatesOpeningAndOmissionsVerified },
  };
  return { config: clean, startDate, endDate: end.toISOString().slice(0, 10) };
}
