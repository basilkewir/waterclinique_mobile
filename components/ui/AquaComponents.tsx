import { AquaColors, BorderRadius, Shadows, Spacing } from '@/constants/theme-constants';
import React, { memo } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { IconSymbol } from './icon-symbol';

const { width: screenWidth } = Dimensions.get('window');

const SimpleGradient: React.FC<{ 
  colors: string[]; 
  style: any; 
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
}> = memo(({ colors, style, children, direction = 'vertical' }) => {
  return (
    <View style={[style, { 
      backgroundColor: colors[0],
      position: 'relative'
    }]}>
      {/* Simple gradient effect using layered views */}
      {colors.slice(1).map((color, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: color,
            opacity: 0.3 - (index * 0.1),
          }}
        />
      ))}
      {children}
    </View>
  );
});

interface AquaCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  shadow?: boolean;
  onPress?: () => void;
}

export const AquaCard: React.FC<AquaCardProps> = memo(({ 
  children, 
  style, 
  gradient = false, 
  shadow = true,
  onPress 
}) => {
  const cardStyle = [
    styles.card,
    shadow && Shadows.md,
    Platform.OS === 'android' && styles.androidCard,
    style
  ];

  const CardComponent = onPress ? TouchableOpacity : View;

  if (gradient) {
    return (
      <CardComponent onPress={onPress} activeOpacity={0.7}>
        <SimpleGradient
          colors={AquaColors.gradients.wave}
          style={cardStyle}
        >
          {children}
        </SimpleGradient>
      </CardComponent>
    );
  }

  return (
    <CardComponent style={cardStyle} onPress={onPress} activeOpacity={0.7}>
      {children}
    </CardComponent>
  );
});

interface AquaButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: any;
}

export const AquaButton: React.FC<AquaButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  icon,
}) => {
  const buttonStyle = [
    styles.button,
    size === 'sm' && styles.buttonSm,
    size === 'md' && styles.buttonMd,
    size === 'lg' && styles.buttonLg,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'outline' && styles.buttonOutline,
    disabled && styles.buttonDisabled,
    style
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'primary' && styles.buttonTextPrimary,
    variant === 'secondary' && styles.buttonTextSecondary,
    variant === 'outline' && styles.buttonTextOutline,
    disabled && styles.buttonTextDisabled
  ];

  const iconColor = variant === 'outline' ? AquaColors.primary : AquaColors.white;

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity style={buttonStyle} onPress={onPress} disabled={disabled}>
        <View style={styles.buttonContent}>
          {icon && <IconSymbol name={icon} size={16} color={iconColor} />}
          <Text style={textStyle} numberOfLines={2}>{title}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} disabled={disabled}>
      <View style={styles.buttonContent}>
        {icon && <IconSymbol name={icon} size={16} color={iconColor} />}
        <Text style={textStyle} numberOfLines={2}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface AquaBadgeProps {
  text: string;
  variant?: 'safe' | 'warning' | 'danger' | 'info';
  style?: ViewStyle;
}

export const AquaBadge: React.FC<AquaBadgeProps> = ({ 
  text, 
  variant = 'info', 
  style 
}) => {
  const badgeStyle = [
    styles.badge,
    variant === 'safe' && styles.badgeSafe,
    variant === 'warning' && styles.badgeWarning,
    variant === 'danger' && styles.badgeDanger,
    variant === 'info' && styles.badgeInfo,
    style
  ];

  const textStyle = [
    styles.badgeText,
    variant === 'safe' && styles.badgeTextSafe,
    variant === 'warning' && styles.badgeTextWarning,
    variant === 'danger' && styles.badgeTextDanger,
    variant === 'info' && styles.badgeTextInfo
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{text}</Text>
    </View>
  );
};

interface WaveHeaderProps {
  title: string;
  subtitle?: string;
  height?: number;
}

export const WaveHeader: React.FC<WaveHeaderProps> = ({ 
  title, 
  subtitle, 
  height = 200 
}) => {
  return (
    <View style={[styles.waveHeader, { height }]}>
      <SimpleGradient
        colors={AquaColors.gradients.ocean}
        style={styles.waveGradient}
      >
        <View style={styles.waveContent}>
          <Text style={styles.waveTitle}>{title}</Text>
          {subtitle && <Text style={styles.waveSubtitle}>{subtitle}</Text>}
        </View>
      </SimpleGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  // Card styles with aqua theme
  card: {
    backgroundColor: AquaColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: AquaColors.cardBorder,
  },
  androidCard: {
    marginHorizontal: Platform.OS === 'android' ? 2 : 0,
    paddingHorizontal: Platform.OS === 'android' ? Spacing.lg : Spacing.md,
    paddingVertical: Platform.OS === 'android' ? Spacing.lg : Spacing.md,
  },

  // Button styles with aqua theme
  button: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'android' ? 50 : 46,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 40,
  },
  buttonMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  buttonLg: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: AquaColors.primary,
  },
  buttonSecondary: {
    backgroundColor: AquaColors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: AquaColors.primary,
  },
  buttonDisabled: {
    backgroundColor: AquaColors.disabled,
    borderColor: AquaColors.disabled,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  buttonTextPrimary: {
    color: AquaColors.surface,
  },
  buttonTextSecondary: {
    color: AquaColors.surface,
  },
  buttonTextOutline: {
    color: AquaColors.primary,
  },
  buttonTextDisabled: {
    color: AquaColors.textSecondary,
  },

  // Badge styles with aqua theme
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSafe: {
    backgroundColor: AquaColors.aquaMedium,
  },
  badgeWarning: {
    backgroundColor: AquaColors.warning,
  },
  badgeDanger: {
    backgroundColor: AquaColors.error,
  },
  badgeInfo: {
    backgroundColor: AquaColors.aquaBright,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextSafe: {
    color: AquaColors.surface,
  },
  badgeTextWarning: {
    color: AquaColors.surface,
  },
  badgeTextDanger: {
    color: AquaColors.surface,
  },
  badgeTextInfo: {
    color: AquaColors.aquaDeep,
  },

  // Wave header styles with aqua theme
  waveHeader: {
    overflow: 'hidden',
  },
  waveGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  waveTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AquaColors.surface,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  waveSubtitle: {
    fontSize: 16,
    color: AquaColors.aquaLight,
    textAlign: 'center',
  },
});