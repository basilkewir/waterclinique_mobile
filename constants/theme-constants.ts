export const AquaColors = {
  // Core aqua-blue palette
  aqua:   '#0077B6',
  sky:    '#00B4D8',
  mint:   '#02C39A',
  gold:   '#F4A261',
  red:    '#E63946',
  dangerDeep: '#7C0000',

  white:    '#FFFFFF',
  offwhite: '#F0F7FF',
  light:    '#CAF0F8',
  gray:     '#64748B',
  grayDark: '#334155',

  // Primary brand colors — aqua blue is the star
  primary:        '#0077B6',
  primaryDark:    '#005F92',
  primaryLight:   '#E6F4FA',
  secondary:      '#00B4D8',
  accent:         '#02C39A',

  // Aliases for backwards compatibility
  navy:   '#0A2342',
  teal:   '#0077B6',
  dark:   '#0D1B2A',
  aquaDeep:       '#0077B6',
  aquaMedium:     '#00B4D8',
  aquaLight:      '#E6F4FA',
  aquaBright:     '#02C39A',

  success:   '#02C39A',
  warning:   '#F4A261',
  error:     '#E63946',
  info:      '#0077B6',

  quality: {
    excellent: '#02C39A',
    good:      '#0077B6',
    fair:      '#F4A261',
    poor:      '#E63946',
  },

  gradients: {
    primary: ['#0077B6', '#00B4D8'],
    wave:    ['#0077B6', '#00B4D8', '#02C39A'],
    ocean:   ['#0077B6', '#00B4D8', '#02C39A', '#E6F4FA'],
    aqua:    ['#0077B6', '#02C39A', '#E6F4FA'],
    deep:    ['#005F92', '#0077B6', '#00B4D8'],
    light:   ['#E6F4FA', '#CAF0F8', '#FFFFFF'],
  },

  // Surface & background colors
  surface:        '#FFFFFF',
  background:     '#F0F7FF',
  text:           '#0D1B2A',
  textDark:       '#0D1B2A',
  textSecondary:  '#334155',
  textMuted:      '#64748B',
  textOnDark:     '#FFFFFF',
  border:         'rgba(0,119,182,0.12)',
  borderLight:    'rgba(0,119,182,0.06)',
  shadow:         'rgba(0,0,0,0.06)',
  shadowDark:     'rgba(0,0,0,0.12)',

  // Card backgrounds
  cardBg:         '#FFFFFF',
  cardBgTinted:   'rgba(0,119,182,0.04)',
  cardBorder:     'rgba(0,119,182,0.1)',

  pressed:  '#005F92',
  focused:  '#0077B6',
  disabled: 'rgba(0,119,182,0.1)',
  hover:    '#00B4D8',

  bgPrimary:   '#F0F7FF',
  bgSecondary: '#FFFFFF',
  bgTertiary:  '#E6F4FA',
  bgAccent:    'rgba(0,119,182,0.06)',
};

export const Colors = AquaColors;

export const lightTheme = {
  background: AquaColors.background,
  text:       AquaColors.text,
  icon:       AquaColors.primary,
  border:     AquaColors.border,
  surface:    AquaColors.surface,
};

export const darkTheme = {
  background: AquaColors.dark,
  text:       AquaColors.white,
  icon:       AquaColors.light,
  border:     AquaColors.border,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
};
