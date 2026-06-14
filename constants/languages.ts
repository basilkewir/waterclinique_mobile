export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string; // Emoji flag
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
];

export const DEFAULT_LANGUAGE = 'en';

export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const getCurrentLanguage = (currentCode: string): Language => {
  return getLanguageByCode(currentCode) || getLanguageByCode(DEFAULT_LANGUAGE)!;
};

export const getNextLanguage = (currentCode: string): Language => {
  const currentIndex = SUPPORTED_LANGUAGES.findIndex(lang => lang.code === currentCode);
  const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
  return SUPPORTED_LANGUAGES[nextIndex];
};
