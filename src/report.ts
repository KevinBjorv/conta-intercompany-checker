import { nok } from './money.ts';
import type { Report } from './types.ts';

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  // Neutralize numeric negatives too: spreadsheet software controls CSV coercion.
  if (/^[\s\u0000-\u001f\ufeff]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
const table = (heads: string[], rows: unknown[][]) => `<div class="scroll"><table><thead><tr>${heads.map(h => `<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function render(report: Report): { html: string; csv: string; json: string } {
  const r = report, s = r.scope;
  const complete = r.completeness === 'COMPLETE';
  const status = r.completeness === 'INCOMPLETE' ? 'Ufullstendig kontroll' : r.agreement === 'BALANCES_AGREE' ? 'Saldoene stemmer innenfor toleransen' : 'Differanse i saldoene';
  const candidateIds = new Set(r.candidates.flatMap(c => [`A:${c.a}`, `B:${c.b}`]));
  const reasons = new Map(r.unresolved.map(u => [`${u.side}:${u.lineId}`, u.reason]));
  const lineRows = r.lines.map(l => [l.side, l.account, l.id, l.original.transactionId, l.original.transactionNoYear ?? l.original.transactionNo ?? '', l.date, l.amount, l.invoiceNo ?? '', l.correction ? 'Ja' : 'Nei', l.description,
    candidateIds.has(`${l.side}:${l.id}`) ? 'Kandidat – krever vurdering' : reasons.get(`${l.side}:${l.id}`) ?? 'Ikke vurdert']);
  const heads = ['Side', 'Konto', 'Kildelinje-ID', 'Transaksjons-ID', 'Bilagsnummer', 'Dato', 'Beløp NOK', 'Fakturareferanse', 'Korreksjon/reversering', 'Beskrivelse', 'Vurdering'];
  const csvRows: unknown[][] = [
    ['Mellomværendekontroll for Conta', r.synthetic ? 'KUN SYNTETISKE DATA' : 'Privat regnskapsmateriale'],
    ['Datastatus', r.completeness], ['Saldostatus', r.agreement ?? 'IKKE VURDERT'],
    ['Selskap A', s?.config.companies.A.name ?? '', s?.config.companies.A.organizationId ?? ''],
    ['Selskap B', s?.config.companies.B.name ?? '', s?.config.companies.B.organizationId ?? ''],
    ['Valgte kontoer A', s?.config.companies.A.accounts.map(a => a.number).join(', ') ?? 'UKJENT'],
    ['Valgte kontoer B', s?.config.companies.B.accounts.map(a => a.number).join(', ') ?? 'UKJENT'],
    ['Fra', s?.startDate ?? '', 'Til', s?.endDate ?? ''], ['Toleranse NOK', s?.config.tolerance ?? ''],
    ['Side', 'Konto', 'Inngående NOK', 'Bevegelse NOK', 'Utgående NOK'],
    ...r.accounts.map(a => [a.side, a.account, a.opening, a.movement, a.closing]),
    ['Restsaldo A + B', '', r.residual?.opening ?? 'UKJENT', r.residual?.movement ?? 'UKJENT', r.residual?.closing ?? 'UKJENT'],
    ['Absolutt utgående differanse NOK', r.residual?.magnitude ?? 'UKJENT'],
    ['Antall kandidatpar', complete ? r.candidates.length : 'IKKE VURDERT'],
    ['Antall linjer uten kandidat', complete ? r.unresolved.length : 'IKKE VURDERT'],
    ...r.issues.map(i => ['Problem', i]),
    ['Saldoenighet er ikke ferdig avstemming. Kandidater og uavklarte linjer krever regnskapsførers vurdering.'],
    [], ['Linje A', 'Linje B', 'Felles referanse', 'Begrunnelse'],
    ...r.candidates.map(c => [c.a, c.b, c.reference, c.reason]),
    [], heads, ...lineRows, [], ['Kilde', 'URL', 'Hentet', 'HTTP'],
    ...r.sources.map(source => [source.key, source.url, source.retrievedAt, source.status]),
  ];
  const html = `<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Mellomværendekontroll for Conta</title><style>
  :root{font-family:system-ui,sans-serif;color:#172b36;background:#f2f5f4}body{margin:0}main{max-width:1120px;margin:32px auto;padding:32px;background:white;border-radius:12px}h1{font-size:30px;line-height:1.2}h2{margin-top:32px;font-size:21px}.eyebrow{font-size:13px;letter-spacing:.07em;text-transform:uppercase;color:#526b71}.status{padding:20px;background:#edf5f1;border-left:5px solid #1c6955}.amount{font-size:36px;font-weight:700;margin:10px 0}.note{color:#465961;line-height:1.6}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:10px;text-align:left;border-bottom:1px solid #dce4e2;vertical-align:top;overflow-wrap:anywhere}th{background:#edf2f1}ul{line-height:1.7}footer{margin-top:32px;border-top:1px solid #dce4e2;padding-top:16px;font-size:12px;color:#465961}@media(max-width:600px){main{margin:0;padding:20px;border-radius:0}h1{font-size:25px}.amount{font-size:30px}}@media print{main{margin:0;padding:0;max-width:none}.scroll{overflow:visible}thead{display:table-header-group}tr{break-inside:avoid}}
  </style></head><body><main><p class="eyebrow">${r.synthetic ? 'Demonstrasjon · kun syntetiske data' : 'Privat · grunnlag for regnskapsførers vurdering'}</p><h1>Mellomværendekontroll for Conta</h1>
  <p>${escapeHtml(s?.config.companies.A.name ?? 'Ukjent selskap')} ↔ ${escapeHtml(s?.config.companies.B.name ?? 'Ukjent selskap')}</p><p>${escapeHtml(s?.startDate)}–${escapeHtml(s?.endDate)} · NOK · toleranse ${escapeHtml(s ? nok(s.config.tolerance) : 'ukjent')}</p>
  <section class="status"><strong>${escapeHtml(status)}</strong><p class="amount">${r.residual ? escapeHtml(nok(r.residual.closing)) + ' NOK' : 'Ikke beregnet'}</p><p>Signert utgående restsaldo: A + B${r.residual ? '. Absolutt differanse: ' + escapeHtml(nok(r.residual.magnitude)) + ' NOK.' : '.'}</p><p>Datastatus: ${r.completeness} · Saldostatus: ${r.agreement ?? 'IKKE VURDERT'}</p></section>
  <p class="note">Saldoenighet er ikke en ferdig avstemming eller bevis på at alle transaksjoner er bokført. Uavklarte linjer er ikke bekreftede bokføringsfeil. Regnskapsføreren godkjenner kontovalg og konklusjoner.</p>
${r.issues.length ? '<h2>Problemer som må løses</h2><ul>' + r.issues.map(i => '<li>' + escapeHtml(i) + '</li>').join('') + '</ul>' : ''}
  <h2>Omfang og kontovalg</h2>${table(['Side', 'Selskap', 'Conta-ID', 'Dedikerte kontoer'], s ? (['A', 'B'] as const).map(side => [side, s.config.companies[side].name, s.config.companies[side].organizationId, s.config.companies[side].accounts.map(a => a.number).join(', ')]) : [])}
  <h2>Inngående saldo, bevegelse og utgående saldo</h2>${table(['Side/konto', 'Inngående NOK', 'Bevegelse NOK', 'Utgående NOK'], [...r.accounts.map(a => [a.side + ' / ' + a.account, nok(a.opening), nok(a.movement), nok(a.closing)]), ...(r.residual ? [['Restsaldo A + B', nok(r.residual.opening), nok(r.residual.movement), nok(r.residual.closing)]] : [])])}
  <p class="note">Inngående restsaldo + periodens bevegelsesdifferanse = utgående restsaldo. En inngående differanse oppsto før denne måneden.</p>
  <h2>Kandidatforslag (${complete ? r.candidates.length : 'ikke vurdert'})</h2>${table(['Linje A', 'Linje B', 'Felles referanse', 'Begrunnelse'], r.candidates.map(c => [c.a, c.b, c.reference, c.reason]))}<p class="note">${complete ? `Ingen forslag er automatisk bekreftet. ${r.unresolved.length} linjer gjenstår uten kandidat.` : 'Kandidater og antall uavklarte linjer kan ikke vurderes før kontrollen er fullført.'}</p>
  <h2>${complete ? `Linjegrunnlag (${r.lines.length})` : 'Tilgjengelig linjegrunnlag – ufullstendig'}</h2>${complete ? '' : '<p class="note">Tabellen viser bare linjer som er validert før kontrollen stoppet. En tom tabell betyr ikke at perioden er uten transaksjoner.</p>'}${table(heads, lineRows)}
  <h2>Kilder og innhenting</h2>${table(['Kilde', 'Hentet (UTC)', 'HTTP'], r.sources.map(source => [source.key, source.retrievedAt, source.status]))}
  <p class="note">Saldoene hentes på nytt etter detaljene. Dette oppdager enkelte endringer underveis, men gir ikke et atomisk historisk øyeblikksbilde. Endringer som utligner hverandre kan forbli uoppdaget.</p><footer>Generert ${escapeHtml(r.generatedAt)} · versjon ${r.version} · Oppbevar rapport og kildegrunnlag privat etter virksomhetens rutiner.</footer></main></body></html>`;
  return { html, csv: '\ufeff' + csvRows.map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n', json: JSON.stringify(report, null, 2) };
}
