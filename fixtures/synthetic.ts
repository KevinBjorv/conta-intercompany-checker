import { scopeFor } from '../src/config.ts';
import { requestPlan } from '../src/transport.ts';
import type { Config, Receipt } from '../src/types.ts';

export const demoTime = new Date('2026-09-16T12:00:00Z');
export function demoConfig(): Config {
  return {
    environment: 'sandbox', period: '2026-08', tolerance: '0.01',
    companies: {
      A: { organizationId: '900001', name: 'Eksempel Fjord AS (syntetisk)', authorized: true, currency: 'NOK', accounts: [{ number: '1560', dedicatedToOtherCompany: true, positionsInNok: true }] },
      B: { organizationId: '900002', name: 'Eksempel Ås AS (syntetisk)', authorized: true, currency: 'NOK', accounts: [{ number: '2960', dedicatedToOtherCompany: true, positionsInNok: true }] },
    },
    sharedInvoiceNumbersConfirmed: true, candidateDateWindowDays: 3,
    liveValidation: { reference: '', signsDatesOpeningAndOmissionsVerified: false },
  };
}
export function demoFixture(config = demoConfig()): { config: Config; receipts: Receipt[] } {
  const scope = scopeFor(config, demoTime);
  const receipts = requestPlan(scope).map((request, index): Receipt => {
    const side = request.side, account = side === 'A' ? '1560' : '2960';
    let body: unknown;
    if (request.kind === 'accounts') body = [{ id: side === 'A' ? '10' : '20', bookkeepingAccountNo: account, name: 'Mellomværende – dedikert konto', isActive: true }];
    else if (request.kind === 'details') body = Array.from({ length: 10 }, (_, i) => ({
      id: String((side === 'A' ? 1000 : 2000) + i), transactionId: String((side === 'A' ? 10000 : 20000) + i), transactionNoYear: `${i + 1}-2026`,
      date: `2026-08-${String(i === 9 ? 31 : i + 1).padStart(2, '0')}`, bookkeepingAccountNo: account,
      amount: side === 'A' ? '15000.00' : i === 9 ? '-5000.00' : '-15000.00',
      invoiceNo: i === 9 ? (side === 'A' ? 'A-ONLY' : 'B-ONLY') : `DEMO-${i + 1}`,
      description: `Syntetisk mellomværende ${i + 1}`, isResetTransaction: false, isCorrection: false,
    }));
    else body = { trialBalanceOutputSub: [{ bookkeepingAccountNo: account, bookkeepingAccountName: 'Mellomværende',
      sumIngoing: side === 'A' ? '100000.00' : '-85000.00', sumChanged: side === 'A' ? '150000.00' : '-140000.00', sumOutgoing: side === 'A' ? '250000.00' : '-225000.00' }],
      // Deliberately unrelated organization totals: must never be compared.
      sumIngoing: '0.00', sumChanged: '0.00', sumOutgoing: '0.00' };
    return { request, body, retrievedAt: new Date(demoTime.getTime() - (20 - index) * 1000).toISOString(), status: 200 };
  });
  return { config, receipts };
}
