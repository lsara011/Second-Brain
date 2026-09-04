import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from '@tamagui/lucide-icons-2';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { supabase } from '../../utils/supabase';
import { useAppTheme } from '@/context/AppTheme';

export default function SignupScreen(): React.ReactElement {
  const { colors, isDark } = useAppTheme();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setError('Complete every field.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptedTerms) {
      setError('Accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: normalizedName } },
      });

      if (signupError) {
        setError(signupError.message);
      } else if (!data.session) {
        setMessage('Account created. Check your email to confirm your account, then sign in.');
      }
    } catch {
      setError('Unable to reach the authentication service. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={styles.page}
            entering={FadeIn.duration(450)}
            exiting={FadeOut.duration(250)}
          >
            <Image
              source={require('../../assets/images/second-brain-wordmark.png')}
              style={[styles.wordmark, isDark && styles.wordmarkDark]}
              resizeMode="contain"
              accessibilityLabel="Second Brain"
            />
            <Text style={[styles.title, { color: colors.text }]}>Create your account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Build better study habits with a workspace made for you.
            </Text>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowOpacity: isDark ? 0 : 0.08,
                },
              ]}
            >
              <FieldLabel text="Full name" color={colors.text} />
              <InputShell backgroundColor={colors.surfaceSecondary} borderColor={colors.border}>
                <UserRound size={19} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  textContentType="name"
                />
              </InputShell>

              <FieldLabel text="Email" color={colors.text} spaced />
              <InputShell backgroundColor={colors.surfaceSecondary} borderColor={colors.border}>
                <Mail size={19} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              </InputShell>

              <FieldLabel text="Password" color={colors.text} spaced />
              <InputShell backgroundColor={colors.surfaceSecondary} borderColor={colors.border}>
                <LockKeyhole size={19} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide passwords' : 'Show passwords'}
                  hitSlop={10}
                  onPress={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <EyeOff size={19} color={colors.textSecondary} />
                  ) : (
                    <Eye size={19} color={colors.textSecondary} />
                  )}
                </Pressable>
              </InputShell>

              <FieldLabel text="Confirm password" color={colors.text} spaced />
              <InputShell backgroundColor={colors.surfaceSecondary} borderColor={colors.border}>
                <LockKeyhole size={19} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Enter your password again"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                />
              </InputShell>

              <Pressable
                style={styles.termsRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                onPress={() => setAcceptedTerms((current) => !current)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: acceptedTerms ? colors.primary : 'transparent',
                      borderColor: acceptedTerms ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {acceptedTerms && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </View>
                <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                  I agree to the Terms of Service and Privacy Policy.
                </Text>
              </Pressable>

              {!!error && <Text style={styles.errorText}>{error}</Text>}
              {!!message && <Text style={[styles.successText, { color: colors.primary }]}>{message}</Text>}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmitting }}
                disabled={isSubmitting}
                onPress={() => void handleSignup()}
                style={({ pressed }) => [
                  styles.createButton,
                  { backgroundColor: colors.primary },
                  isSubmitting && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.createButtonText}>Create account</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
              <Link href="/login" asChild>
                <Pressable accessibilityRole="button">
                  <Text style={[styles.loginLink, { color: colors.primary }]}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ text, color, spaced = false }: { text: string; color: string; spaced?: boolean }) {
  return <Text style={[styles.label, spaced && styles.spacedLabel, { color }]}>{text}</Text>;
}

function InputShell({
  children,
  backgroundColor,
  borderColor,
}: {
  children: React.ReactNode;
  backgroundColor: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.inputContainer, { backgroundColor, borderColor }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboardArea: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  page: { width: '100%', maxWidth: 440, alignSelf: 'center', alignItems: 'center' },
  wordmark: { width: 210, height: 118 },
  wordmarkDark: { tintColor: '#ffffff' },
  title: { marginTop: 16, fontSize: 29, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { marginTop: 8, marginBottom: 26, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  card: {
    width: '100%',
    padding: 22,
    borderWidth: 1,
    borderRadius: 20,
    shadowColor: '#101828',
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '700' },
  spacedLabel: { marginTop: 17 },
  inputContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 },
  termsRow: { marginTop: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 6,
  },
  termsText: { flex: 1, fontSize: 13, lineHeight: 19 },
  errorText: { marginTop: 16, color: '#d92d20', fontSize: 14, lineHeight: 20 },
  successText: { marginTop: 16, fontSize: 14, lineHeight: 20 },
  createButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderRadius: 12,
  },
  createButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.65 },
  loginRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '800' },
  orText: { fontSize: 14, textAlign: 'center', marginVertical: 16 },
});
