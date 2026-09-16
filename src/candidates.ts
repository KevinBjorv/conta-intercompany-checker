import { ore } from './money.ts';
import type { Candidate, Config, LedgerLine, Unresolved } from './types.ts';

export function suggest(lines: LedgerLine[], config: Config): { candidates: Candidate[]; unresolved: Unresolved[] } {
  const candidates: Candidate[] = [], unresolved: Unresolved[] = [];
  const groups = new Map<string, { A: LedgerLine[]; B: LedgerLine[] }>();
  for (const l of lines) if (l.invoiceNo) {
    if (!groups.has(l.invoiceNo)) groups.set(l.invoiceNo, { A: [], B: [] });
    groups.get(l.invoiceNo)![l.side].push(l);
  }
  for (const line of lines) {
    let reason = '';
    const group = line.invoiceNo ? groups.get(line.invoiceNo)! : { A: [], B: [] };
    const a = group.A, b = group.B;
    if (!config.sharedInvoiceNumbersConfirmed) reason = 'Felles fakturareferanse er ikke bekreftet for relasjonen.';
    else if (!line.invoiceNo) reason = 'Mangler felles fakturareferanse.';
    else if (a.length > 1 || b.length > 1) reason = 'Tvetydig referanse: flere linjer eller delt oppgjør.';
    else if (!a.length || !b.length) reason = 'Ingen linje med samme fakturareferanse hos motparten.';
    else if (a[0]!.correction || b[0]!.correction) reason = 'Reversering eller korrigering krever manuell vurdering.';
    else if (ore(a[0]!.amount) === 0n || ore(a[0]!.amount) + ore(b[0]!.amount) !== 0n) reason = 'Referansen har ulike eller ikke motsatte beløp.';
    else if (Math.abs(Date.parse(a[0]!.date) - Date.parse(b[0]!.date)) / 86400000 > config.candidateDateWindowDays) reason = 'Referansen ligger utenfor valgt datovindu.';
    else {
      if (line.side === 'A') candidates.push({ a: a[0]!.id, b: b[0]!.id, reference: line.invoiceNo!, reason: 'Samme bekreftede fakturareferanse, motsatte like beløp og dato innenfor datovindu. Kun forslag.' });
      continue;
    }
    unresolved.push({ side: line.side, lineId: line.id, reason });
  }
  return { candidates, unresolved };
}
