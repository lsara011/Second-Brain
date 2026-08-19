import Storage from 'expo-sqlite/kv-store';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'automatic' | 'light' | 'dark';

const THEME_KEY = 'app-theme-mode';

const lightColors = {
  background: '#f7f7f7',
  surface: '#ffffff',
  surfaceSecondary: '#f9fafb',
  text: '#101828',
  textSecondary: '#475467',
  border: '#d0d5dd',
  primary: '#208AEF',
  activeSurface: '#eaf4ff',
  danger: '#d92d20',
};

const darkColors = {
  background: '#0f1115',
  surface: '#191c22',
  surfaceSecondary: '#232730',
  text: '#f2f4f7',
  textSecondary: '#b3bac6',
  border: '#343a46',
  primary: '#5aaeff',
  activeSurface: '#173a5e',
  danger: '#ff746b',
};

interface AppThemeValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  isDark: boolean;
  colors: typeof lightColors;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const AppThemeContext = createContext<AppThemeValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('automatic');

  useEffect(() => {
    Storage.getItem(THEME_KEY).then((savedMode) => {
      if (savedMode === 'automatic' || savedMode === 'light' || savedMode === 'dark') {
        setModeState(savedMode);
      }
    });
  }, []);

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await Storage.setItem(THEME_KEY, nextMode);
  };

  const resolvedMode: 'light' | 'dark' =
    mode === 'automatic' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const isDark = resolvedMode === 'dark';
  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      isDark,
      colors: isDark ? darkColors : lightColors,
      setMode,
    }),
    [mode, resolvedMode, isDark]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(AppThemeContext);
  if (!theme) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return theme;
}
