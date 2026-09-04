import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View } from 'react-native';
import { TamaguiProvider } from 'tamagui';
import {SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import tamaguiConfig from '../../tamagui.config';
import { AppThemeProvider, useAppTheme } from '@/context/AppTheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
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
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </AppThemeProvider>
    </SQLiteProvider>
  );
}

function AppLayout() {
  const { resolvedMode, colors } = useAppTheme();
  const { session, isLoading } = useAuth();

  return (
    <TamaguiProvider
      config={tamaguiConfig}
      defaultTheme={resolvedMode}
    >
      <ThemeProvider value={resolvedMode === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
        <AnimatedSplashOverlay />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {isLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'none',
                presentation: 'card',
              }}
            >
              <Stack.Protected guard={!session}>
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
              </Stack.Protected>
              <Stack.Protected guard={!!session}>
                <Stack.Screen name="index" />
                <Stack.Screen name="AddSchedule" />
                <Stack.Screen name="AICompanion" />
                <Stack.Screen name="Profile" />
                <Stack.Screen name="Settings" />
              </Stack.Protected>
            </Stack>
          )}
        </View>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
