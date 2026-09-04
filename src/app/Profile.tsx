import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, CalendarDays, GraduationCap, Mail, Pencil, UserRound, X } from '@tamagui/lucide-icons-2';

import { BottomNav } from '@/components/BottomNav';
import { useAppTheme } from '@/context/AppTheme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '../../utils/supabase';

type ProfileForm = {
  fullName: string;
  grade: string;
  graduationYear: string;
  major: string;
  avatarUrl: string;
};

const EMPTY_PROFILE: ProfileForm = {
  fullName: '',
  grade: '',
  graduationYear: '',
  major: '',
  avatarUrl: '',
};

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<ProfileForm>(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const metadata = session?.user.user_metadata ?? {};
    const nextProfile = {
      fullName: metadata.full_name ?? '',
      grade: metadata.grade ?? '',
      graduationYear: metadata.graduation_year ?? '',
      major: metadata.major ?? '',
      avatarUrl: metadata.avatar_url ?? '',
    };
    setProfile(nextProfile);
    setDraft(nextProfile);
  }, [session]);

  const initials = useMemo(() => {
    const value = profile.fullName || session?.user.email || 'Student';
    return value
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }, [profile.fullName, session?.user.email]);

  const startEditing = () => {
    setDraft(profile);
    setMessage('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setMessage('');
    setIsEditing(false);
  };

  const saveProfile = async () => {
    if (!draft.fullName.trim()) {
      setMessage('Please enter your name.');
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const cleanedProfile = {
        fullName: draft.fullName.trim(),
        grade: draft.grade.trim(),
        graduationYear: draft.graduationYear.trim(),
        major: draft.major.trim(),
        avatarUrl: draft.avatarUrl.trim(),
      };
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: cleanedProfile.fullName,
          grade: cleanedProfile.grade,
          graduation_year: cleanedProfile.graduationYear,
          major: cleanedProfile.major,
          avatar_url: cleanedProfile.avatarUrl,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setProfile(cleanedProfile);
      setDraft(cleanedProfile);
      setIsEditing(false);
      setMessage('Profile saved.');
    } catch {
      setMessage('Unable to save your profile. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.keyboardArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headingRow}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your student information</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Cancel editing' : 'Edit profile'}
              onPress={isEditing ? cancelEditing : startEditing}
              style={({ pressed }) => [styles.editButton, { backgroundColor: colors.activeSurface }, pressed && styles.pressed]}
            >
              {isEditing ? <X size={19} color={colors.primary} /> : <Pencil size={18} color={colors.primary} />}
              <Text style={[styles.editButtonText, { color: colors.primary }]}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.activeSurface, borderColor: colors.border }]}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} accessibilityLabel="Profile photo" />
              ) : (
                <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
              )}
            </View>
            <Text style={[styles.name, { color: colors.text }]}>{profile.fullName || 'Student'}</Text>
            <View style={styles.emailRow}>
              <Mail size={15} color={colors.textSecondary} />
              <Text style={[styles.email, { color: colors.textSecondary }]}>{session?.user.email}</Text>
            </View>
          </View>

          {isEditing ? (
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ProfileInput label="Name" value={draft.fullName} onChangeText={(fullName) => setDraft({ ...draft, fullName })} />
              <ProfileInput label="Grade" value={draft.grade} onChangeText={(grade) => setDraft({ ...draft, grade })} placeholder="Example: Senior" />
              <ProfileInput label="Graduation year" value={draft.graduationYear} onChangeText={(graduationYear) => setDraft({ ...draft, graduationYear })} placeholder="Example: 2027" keyboardType="number-pad" />
              <ProfileInput label="Major" value={draft.major} onChangeText={(major) => setDraft({ ...draft, major })} placeholder="Example: Computer Science" />
              <ProfileInput label="Photo URL" value={draft.avatarUrl} onChangeText={(avatarUrl) => setDraft({ ...draft, avatarUrl })} placeholder="https://example.com/photo.jpg" autoCapitalize="none" />

              {!!message && <Text style={[styles.message, { color: colors.danger }]}>{message}</Text>}
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => void saveProfile()}
                style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary }, isSaving && styles.disabled, pressed && styles.pressed]}
              >
                {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Save profile</Text>}
              </Pressable>
            </View>
          ) : (
            <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <DetailRow icon={GraduationCap} label="Grade" value={profile.grade} />
              <DetailRow icon={CalendarDays} label="Graduation year" value={profile.graduationYear} />
              <DetailRow icon={BookOpen} label="Major" value={profile.major} last />
              {!!message && <Text style={[styles.message, { color: colors.primary }]}>{message}</Text>}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav />
    </SafeAreaView>
  );
}

function ProfileInput({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
      />
    </View>
  );
}

function DetailRow({ icon: Icon, label, value, last = false }: { icon: typeof UserRound; label: string; value: string; last?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.detailRow, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.detailIcon, { backgroundColor: colors.activeSurface }]}>
        <Icon size={21} color={colors.primary} />
      </View>
      <View style={styles.detailText}>
        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.text }]}>{value || 'Not added yet'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboardArea: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 600, alignSelf: 'center', padding: 24, paddingBottom: 36 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { marginTop: 5, fontSize: 14 },
  editButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, borderRadius: 12 },
  editButtonText: { fontSize: 14, fontWeight: '700' },
  card: { alignItems: 'center', padding: 24, borderWidth: 1, borderRadius: 20 },
  avatar: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderRadius: 52 },
  avatarImage: { width: '100%', height: '100%' },
  initials: { fontSize: 34, fontWeight: '800' },
  name: { marginTop: 15, fontSize: 23, fontWeight: '800', textAlign: 'center' },
  emailRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  email: { fontSize: 14 },
  detailsCard: { marginTop: 18, paddingHorizontal: 18, borderWidth: 1, borderRadius: 18 },
  detailRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center' },
  detailIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  detailText: { flex: 1, marginLeft: 14 },
  detailLabel: { fontSize: 13, fontWeight: '600' },
  detailValue: { marginTop: 4, fontSize: 16, fontWeight: '700' },
  formCard: { marginTop: 18, padding: 20, borderWidth: 1, borderRadius: 18 },
  field: { marginBottom: 16 },
  fieldLabel: { marginBottom: 7, fontSize: 14, fontWeight: '700' },
  input: { minHeight: 50, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderRadius: 12, fontSize: 16 },
  message: { marginBottom: 14, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  saveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.55 },
});
