import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AquaColors } from '@/constants/theme';
import { SUPPORTED_LANGUAGES, getCurrentLanguage } from '@/constants/languages';

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLang = getCurrentLanguage(i18n.language);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.language')}</Text>
      <View style={styles.buttonContainer}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = i18n.language === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                isActive && styles.activeButton,
              ]}
              onPress={() => changeLanguage(lang.code)}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.buttonText,
                  isActive && styles.activeButtonText,
                ]}
              >
                {lang.nativeName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.dark,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AquaColors.light,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  flag: {
    fontSize: 20,
    lineHeight: 24,
  },
  activeButton: {
    backgroundColor: AquaColors.primary,
    borderColor: AquaColors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: AquaColors.dark,
  },
  activeButtonText: {
    color: 'white',
  },
});