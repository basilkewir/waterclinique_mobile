/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { darkTheme, lightTheme } from '@/constants/theme-constants';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof lightTheme & keyof typeof darkTheme
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const themeObject = theme === 'light' ? lightTheme : darkTheme;
    return themeObject[colorName];
  }
}
