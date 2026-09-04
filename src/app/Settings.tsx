import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/BottomNav';
import { ThemeMode, useAppTheme } from '@/context/AppTheme';
import { supabase } from '../../utils/supabase';

const OPTIONS: { label: string; value: ThemeMode; description: string }[] = [
  { label: 'Automatic', value: 'automatic', description: 'Match your device appearance' },
  { label: 'Light', value: 'light', description: 'Always use the light theme' },
  { label: 'Dark', value: 'dark', description: 'Always use the dark theme' },
];

export default function SettingsScreen() {
  const { mode, setMode, colors } = useAppTheme();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Logout failed:', error.message);
    } catch {
      console.error('Unable to reach the authentication service.');
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {OPTIONS.map((option, index) => {
            const selected = mode === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setMode(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  index < OPTIONS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{option.description}</Text>
                </View>
                <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
                  {selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
              </Pressable>
            );
          })}

        </View>
        <Pressable
  onPress={handleLogout}
  style={({ pressed }) => [
    styles.logOutButton,
    {
      backgroundColor: colors.primary,
      borderColor: colors.border,
    },
    pressed && styles.logOutButtonPressed,
  ]}
>
  <Text style={styles.logOutText}>Log Out</Text>
</Pressable>
      </View>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, padding: 24 },
  title: { marginTop: 12, fontSize: 30, fontWeight: '700' },
  sectionTitle: { marginTop: 32, marginBottom: 10, fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  option: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '600' },
  optionDescription: { marginTop: 3, fontSize: 13 },
  radio: { width: 22, height: 22, borderWidth: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  pressed: { opacity: 0.65 },
  logOutButton: { marginTop: 24, padding: 12, borderWidth: 1, borderColor:'#d0d5dd', backgroundColor: '#208AEF', borderRadius: 8 },
  logOutText: {color: 'white', textAlign: 'center',fontWeight: '600'},
  logOutButtonPressed: {opacity: 0.7,},
});
