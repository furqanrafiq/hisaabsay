export function formatCurrency(amount: number, currency = 'PKR'): string {
  const symbols: Record<string, string> = {
    PKR: 'Rs ',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    SAR: 'SAR ',
  };
  const symbol = symbols[currency] ?? currency + ' ';
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
