export type Side = 'A' | 'B';
export type Kind = 'accounts' | 'before' | 'details' | 'after';
export interface Company {
  organizationId: string;
  name: string;
  authorized: boolean;
  currency: 'NOK';
  accounts: { number: string; dedicatedToOtherCompany: boolean; positionsInNok: boolean }[];
}
export interface Config {
  environment: 'sandbox' | 'production';
  period: string | 'last-completed-month';
  tolerance: string;
  companies: Record<Side, Company>;
  sharedInvoiceNumbersConfirmed: boolean;
  candidateDateWindowDays: number;
  liveValidation: { reference: string; signsDatesOpeningAndOmissionsVerified: boolean };
}
export interface Scope { config: Config; startDate: string; endDate: string }
export interface Request {
  key: string; side: Side; kind: Kind; account?: string; url: string;
}
export interface Receipt {
  request: Request; retrievedAt: string; status: number; body?: unknown; failure?: string;
}
export interface LedgerLine {
  side: Side; account: string; id: string; date: string; amount: string;
  invoiceNo: string | null; description: string; correction: boolean;
  original: Record<string, unknown>;
}
export interface Balance { opening: string; movement: string; closing: string }
export interface AccountBalance extends Balance {
  side: Side; account: string; accountId?: string;
  original: { sumIngoing: string; sumChanged: string; sumOutgoing: string };
}
export interface Candidate { a: string; b: string; reference: string; reason: string }
export interface Unresolved { side: Side; lineId: string; reason: string }
export interface Report {
  version: '0.1.0'; synthetic: boolean; generatedAt: string;
  completeness: 'COMPLETE' | 'INCOMPLETE';
  agreement: 'BALANCES_AGREE' | 'DIFFERENCE' | null;
  scope: Scope | null; issues: string[];
  accounts: AccountBalance[]; totals: Record<Side, Balance> | null;
  residual: (Balance & { magnitude: string }) | null;
  lines: LedgerLine[]; candidates: Candidate[]; unresolved: Unresolved[];
  sources: { key: string; url: string; retrievedAt: string; status: number }[];
}
