import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import sv from '@/locales/sv.json';

// Matches the localStorage key/pattern already used for initialSettings.language
// in useAppStore.ts, so the very first paint renders in the right language
// before SupabaseSync has a chance to hydrate from the server value.
const initialLanguage = (localStorage.getItem('language') as 'en' | 'sv') ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sv: { translation: sv },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes rendered text
    },
  });

export default i18n;
