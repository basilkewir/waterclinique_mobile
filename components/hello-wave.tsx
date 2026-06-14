import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated from 'react-native-reanimated';

export function HelloWave() {
  return (
    <Animated.View
      style={{
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      <IconSymbol name="hand.wave.fill" size={28} color="#F4A261" />
    </Animated.View>
  );
}
