// All arithmetic uses integer øre. Decimal strings cross JSON boundaries.
export function ore(value: unknown): bigint {
  if (typeof value !== 'string' || !/^-?(0|[1-9]\d*)(\.\d{1,2})?$/.test(value)) {
    throw new Error('Ugyldig beløp: forventet desimaltall med høyst to desimaler.');
  }
  const negative = value.startsWith('-');
  const [whole = '', fraction = ''] = (negative ? value.slice(1) : value).split('.');
  return (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))) * (negative ? -1n : 1n);
}
export function decimal(value: bigint): string {
  const sign = value < 0n ? '-' : '';
  const n = value < 0n ? -value : value;
  return `${sign}${n / 100n}.${String(n % 100n).padStart(2, '0')}`;
}
export function abs(n: bigint): bigint { return n < 0n ? -n : n; }
export function nok(value: string): string {
  const [whole = '', fraction = '00'] = value.split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${fraction.padEnd(2, '0')}`;
}
