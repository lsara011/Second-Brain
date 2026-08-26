import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const LOGO_WIDTH = 120;

export function AtlasLogo() {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-LOGO_WIDTH, {
        duration: 2500,
        easing: Easing.inOut(Easing.linear),
      }),
      -1,
      true
    );
  }, [translateX]);

  const animatedGradient = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <MaskedView
      style={styles.mask}
      maskElement={
        <View style={styles.maskContent}>
          <Text style={styles.logoText}>Atlas</Text>
        </View>
      }
    >
      <Animated.View style={[styles.gradientTrack, animatedGradient]}>
        <LinearGradient
          colors={[
            '#208AEF',
            '#7C3AED',
            '#EC4899',
            '#208AEF',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  mask: {
    width: LOGO_WIDTH,
    height: 70,
  },

  maskContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    color: '#000',
    fontSize: 32,
    fontWeight: '900',
  },

  gradientTrack: {
    width: LOGO_WIDTH * 2,
    height: 70,
  },
});