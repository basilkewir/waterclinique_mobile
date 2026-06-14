import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../constants/languages';
import en from '../locales/en.json';

// Import French translations with fallback
let fr: any;
try {
  fr = require('../locales/fr.json');
} catch (error) {
  console.warn('French translations not found, using English fallback');
  fr = {};
}

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLanguage)) {
        return savedLanguage;
      } else {
        return DEFAULT_LANGUAGE;
      }
    } catch (error) {
      return DEFAULT_LANGUAGE;
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

// Build resources object from supported languages
const resources: Record<string, { translation: any }> = {};
SUPPORTED_LANGUAGES.forEach(lang => {
  switch (lang.code) {
    case 'en':
      resources.en = { translation: en };
      break;
    case 'fr':
      resources.fr = { translation: fr };
      break;
    // Add more languages here as they are added to SUPPORTED_LANGUAGES
    default:
      console.warn(`Translation file not found for language: ${lang.code}`);
  }
});

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;