import { sv, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';

/**
 * Maps the active i18next language to a date-fns locale, for use with
 * format()'s { locale } option wherever weekday/month names are rendered
 * (e.g. 'EEEE', 'MMMM', 'MMM'). Numeric-only tokens (e.g. 'yyyy-MM-dd', 'd')
 * don't need this - date-fns renders those the same regardless of locale.
 */
export function getDateFnsLocale(language: string): Locale {
  return language.toLowerCase().startsWith('sv') ? sv : enUS;
}
