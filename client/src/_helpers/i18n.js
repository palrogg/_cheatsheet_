/*

  From this example file by Jan Mühlemann and Kevin Ross (MIT license)
  https://github.com/i18next/react-i18next/blob/master/example/react/src/i18n.js

  Config options:
  https://www.i18next.com/overview/configuration-options

*/

import i18n from 'i18next';
import Backend from 'i18next-xhr-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    //lng: 'en', // overrides detection
    fallbackLng: 'en', // preferred language
    debug: false,
    detection: {
      order: ['cookie', 'localStorage', 'path', 'navigator', 'querystring', 'htmlTag', 'subdomain']
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
