import { useLocale } from '../lib/providers';

/**
 * Convenience hook that exposes locale-aware formatting functions.
 * Uses the user's selected regional format from the LocaleProvider.
 */
export function useFormatting() {
  const { fmtDate, fmtTime, fmtDateTime, fmtNumber, fmtCurrency, regionalFormat } = useLocale();

  return {
    fmtDate,
    fmtTime,
    fmtDateTime,
    fmtNumber,
    fmtCurrency,
    regionalFormat,
  };
}
