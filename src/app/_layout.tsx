import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { TamaguiProvider } from 'tamagui';
import {SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import tamaguiConfig from '../../tamagui.config';
import { AppThemeProvider, useAppTheme } from '@/context/AppTheme';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();
async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      hours TEXT NOT NULL,
      professor TEXT NOT NULL,
      description TEXT,
      days TEXT NOT NULL,
      location TEXT NOT NULL,
      FOREIGN KEY (schedule_id)
        REFERENCES schedules(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_schedules_semester_name
      ON schedules(semester_name);

    CREATE INDEX IF NOT EXISTS idx_classes_schedule_id
      ON classes(schedule_id);
  `);
}

export default function TabLayout() {
  return (
    <SQLiteProvider databaseName="second-brain.db" onInit={initializeDatabase}>
      <AppThemeProvider>
        <AppLayout />
      </AppThemeProvider>
    </SQLiteProvider>
  );
}

function AppLayout() {
  const { resolvedMode, colors } = useAppTheme();

  return (
    <TamaguiProvider
      config={tamaguiConfig}
      defaultTheme={resolvedMode}
    >
      <ThemeProvider value={resolvedMode === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
        <AnimatedSplashOverlay />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'none',
              presentation: 'card',
            }}
          />
        </View>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
