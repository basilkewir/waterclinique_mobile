// Fallback for using MaterialIcons on Android and web.

import { MaterialIcons } from '@expo/vector-icons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, Platform, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  'house.fill': 'home',
  'bell.fill': 'notifications',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'plus.circle.fill': 'add-circle',
  'clock.fill': 'schedule',
  'person.fill': 'person',
  'exclamationmark.triangle.fill': 'warning',
  'drop.fill': 'water-drop',
  'camera.fill': 'camera-alt',
  'clipboard.fill': 'assignment',
  'flag.fill': 'flag',
  'exclamationmark.circle.fill': 'error',
  'lightbulb.fill': 'lightbulb',
  'globe': 'public',
  'info.circle.fill': 'info',
  'building.2.fill': 'business',
  'location.fill': 'location-on',
  'phone.fill': 'phone',
  'message.fill': 'message',
  'envelope.fill': 'email',
  'checkmark.circle.fill': 'check-circle',
  'star.fill': 'star',
  'heart.fill': 'favorite',
  'bookmark.fill': 'bookmark',
  'share.fill': 'share',
  'trash.fill': 'delete',
  'edit': 'edit',
  'settings.fill': 'settings',
  'arrow.right': 'arrow-forward',
  'antenna.radiowaves.left.and.right': 'settings-input-antenna',
  'chart.bar.fill': 'bar-chart',
  'wrench.fill': 'build',
  'bolt.fill': 'bolt',
  'eye.fill': 'visibility',
  'magnifyingglass': 'search',
  'calendar': 'calendar-today',
  'xmark': 'close',
  'checkmark': 'check',
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'xmark.circle.fill': 'cancel',
  'xmark.octagon.fill': 'dangerous',
  'checkmark.shield.fill': 'verified-user',
  'wifi.slash': 'wifi-off',
  'sensor.fill': 'sensors',
  'photo.on.rectangle': 'photo-library',
  'questionmark.circle': 'help-outline',
  'microscope': 'biotech',
  'target': 'my-location',
  'hand.wave.fill': 'waving-hand',
  'cloud.rain.fill': 'water',
  'mountain.2.fill': 'landscape',
  'keyboard': 'keyboard',
  'circle.fill': 'circle',
  'sensor.tag.radiowaves.forward.fill': 'wifi',
  'pin.fill': 'push-pin',
  'gear': 'settings',
  'powerplug.fill': 'power',
  'bell.badge.fill': 'notifications-active',
  'language': 'language',
  'c.circle': 'copyright',
  'wifi': 'wifi',
  'circle.grid.3x3.fill': 'grid-view',
  'thermometer.medium': 'thermostat',
  'sparkles': 'auto-awesome',
  'water.waves': 'waves',
  'bubbles.and.sparkles.fill': 'science',
  'paintpalette.fill': 'palette',
  'nose.fill': 'air',
  'arrowtriangle.down.fill': 'expand-more',
  'arrowtriangle.up.fill': 'expand-less',
  'building.columns.fill': 'account-balance',
  'doc.fill': 'description',
  'line.3.horizontal': 'menu',
  'iphone': 'phone-iphone',
  'apple.logo': 'apple',
  'trending.up': 'trending-up',
  'trending.down': 'trending-down',
  'trending.flat': 'trending-flat',
  'pencil.tip.crop.circle': 'edit-note',
  'arrow.clockwise': 'refresh',
  'exclamationmark.shield.fill': 'warning',
  'map.fill': 'map',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // Get the mapped Material Icon name, fallback to 'help' if not found
  const iconName = MAPPING[name] || 'help';
  
  // Debug logging for Android
  if (Platform.OS === 'android') {
    console.log(`IconSymbol: ${name} -> ${iconName}`);
  }
  
  try {
    return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
  } catch (error) {
    console.error(`Error rendering icon ${name} as ${iconName}:`, error);
    // Fallback to a simple text representation
    return <MaterialIcons color={color} size={size} name="help" style={style} />;
  }
}
