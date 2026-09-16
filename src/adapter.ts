import { decimal, ore } from './money.ts';
import { validDate } from './config.ts';
import type { AccountBalance, LedgerLine, Receipt, Scope, Side } from './types.ts';

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Uventet objektskjema fra Conta.');
  return value as Record<string, unknown>;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Uventet listeskjema fra Conta.');
  return value;
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d{0,18}$/.test(value)) throw new Error('Kilde-ID mangler eller er ugyldig.');
  return value;
}
function text(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new Error(`${name} mangler eller er ugyldig.`);
  return value;
}
export function validateAccounts(body: unknown, scope: Scope, side: Side): Record<string, string> {
  const rows = list(body).map(record);
  const ids: Record<string, string> = {};
  for (const a of scope.config.companies[side].accounts) {
    const found = rows.filter(r => r.bookkeepingAccountNo === a.number);
    if (found.length !== 1) throw new Error(`${side}: Konto ${a.number} mangler eller er tvetydig i kontoplanen.`);
    ids[a.number] = id(found[0]!.id);
    if (typeof found[0]!.isActive !== 'boolean') throw new Error(`${side}: Kontostatus mangler for ${a.number}.`);
  }
  return ids;
}
export function balances(body: unknown, scope: Scope, side: Side): AccountBalance[] {
  const rows = list(record(body).trialBalanceOutputSub).map(record);
  return scope.config.companies[side].accounts.map(a => {
    const found = rows.filter(r => r.bookkeepingAccountNo === a.number);
    if (found.length !== 1) throw new Error(`${side}: Konto ${a.number} mangler eller er tvetydig i saldobalansen. Fravær er ikke null.`);
    const row = found[0]!;
    const opening = ore(row.sumIngoing), movement = ore(row.sumChanged), closing = ore(row.sumOutgoing);
    if (opening + movement !== closing) throw new Error(`${side}: Inngående saldo + bevegelse stemmer ikke med utgående saldo på ${a.number}.`);
    return { side, account: a.number, opening: decimal(opening), movement: decimal(movement), closing: decimal(closing),
      original: { sumIngoing: row.sumIngoing as string, sumChanged: row.sumChanged as string, sumOutgoing: row.sumOutgoing as string } };
  });
}
export function ledger(receipt: Receipt, scope: Scope): LedgerLine[] {
  return list(receipt.body).map(value => {
    const row = record(value);
    const account = text(row.bookkeepingAccountNo, 'Kontonummer');
    if (account !== receipt.request.account) throw new Error('Detaljsvaret inneholder en annen konto enn forespurt.');
    if (!validDate(row.date) || row.date < scope.startDate || row.date > scope.endDate) throw new Error('Detaljsvaret inneholder en ugyldig dato eller en dato utenfor perioden.');
    const lineId = id(row.id);
    id(row.transactionId);
    if (typeof row.isResetTransaction !== 'boolean' || typeof row.isCorrection !== 'boolean') throw new Error('Status for reversering eller korrigering mangler.');
    const original: Record<string, unknown> = {};
    // Preserve documented evidence only, never arbitrary response/credential fields.
    for (const key of ['id', 'transactionId', 'transactionNo', 'transactionNoYear', 'date', 'amount', 'bookkeepingAccountNo', 'description', 'invoiceId', 'invoiceNo', 'isResetTransaction', 'resetByTransactionId', 'creditNoteId', 'creditNoteNo', 'isCorrection']) {
      if (row[key] !== undefined) {
        if (row[key] !== null && !['string', 'boolean'].includes(typeof row[key])) throw new Error('Uventet felt i kildebevis.');
        original[key] = row[key];
      }
    }
    const invoiceNo = row.invoiceNo === undefined || row.invoiceNo === null || row.invoiceNo === '' ? null : text(row.invoiceNo, 'Fakturanummer');
    return { side: receipt.request.side, account, id: lineId, date: row.date,
      amount: decimal(ore(row.amount)), invoiceNo,
      description: row.description === undefined ? '' : text(row.description, 'Beskrivelse'),
      correction: row.isResetTransaction || row.isCorrection || row.resetByTransactionId != null || row.creditNoteId != null,
      original };
  });
}
