import { getDefaultTamaguiConfig } from '@tamagui/config-default';
import { Platform } from 'react-native';
import { createTamagui } from 'tamagui';

const config = createTamagui(
  getDefaultTamaguiConfig(Platform.OS === 'web' ? 'web' : 'native')
);

export default config;

type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
