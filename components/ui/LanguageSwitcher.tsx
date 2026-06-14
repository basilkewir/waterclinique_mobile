import { getCurrentLanguage, getNextLanguage, Language } from '@/constants/languages';
import { AquaColors, Shadows, Spacing } from '@/constants/theme-constants';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage(i18n.language));

  useEffect(() => {
    const updateLanguage = () => {
      setCurrentLang(getCurrentLanguage(i18n.language));
    };

    updateLanguage();

    // Listen for language changes
    const unsubscribe = i18n.on('languageChanged', updateLanguage);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [i18n]);

  const toggleLanguage = async () => {
    try {
      const nextLang = getNextLanguage(i18n.language);
      if (i18n.changeLanguage) {
        await i18n.changeLanguage(nextLang.code);
      } else {
        console.warn('i18n.changeLanguage is not available');
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <TouchableOpacity 
      onPress={toggleLanguage} 
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.flag} allowFontScaling={false}>{currentLang.flag}</Text>
        <Text style={styles.text} allowFontScaling={false}>{currentLang.code.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: AquaColors.surface,
    borderRadius: 16,
    marginLeft: Spacing.sm,
    minWidth: 60,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: AquaColors.aquaDeep,
    ...Shadows.sm,
    shadowColor: AquaColors.aquaDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  flag: {
    fontSize: 18,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: AquaColors.aquaDeep,
    letterSpacing: 0.6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});