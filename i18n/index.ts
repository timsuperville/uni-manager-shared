import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enShared from './locales/en/shared.json';
import esShared from './locales/es/shared.json';

const resources = {
  en: {
    shared: enShared
  },
  es: {
    shared: esShared
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: ['shared'],
  defaultNS: 'shared',
  interpolation: {
    escapeValue: false // React already escapes by default
  }
});

export { i18n };
export * from 'react-i18next';
