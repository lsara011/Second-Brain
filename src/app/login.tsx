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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Check, Eye, EyeOff, LockKeyhole, Mail } from '@tamagui/lucide-icons-2';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAppTheme } from '@/context/AppTheme';
import { supabase } from '../../utils/supabase';

export default function LoginScreen() {
  const { colors, isDark } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (loginError) setError(loginError.message);
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
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to continue learning with Atlas.
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
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
              >
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
              </View>

              <Text style={[styles.label, styles.passwordLabel, { color: colors.text }]}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
              >
                <LockKeyhole size={19} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="password"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  hitSlop={10}
                  onPress={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <EyeOff size={19} color={colors.textSecondary} />
                  ) : (
                    <Eye size={19} color={colors.textSecondary} />
                  )}
                </Pressable>
              </View>

              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberButton}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  onPress={() => setRememberMe((current) => !current)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: rememberMe ? colors.primary : 'transparent',
                        borderColor: rememberMe ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {rememberMe && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.optionText, { color: colors.textSecondary }]}>Remember me</Text>
                </Pressable>

                <Pressable accessibilityRole="button">
                  <Text style={[styles.link, { color: colors.primary }]}>Forgot password?</Text>
                </Pressable>
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmitting }}
                disabled={isSubmitting}
                onPress={() => void handleLogin()}
                style={({ pressed }) => [
                  styles.loginButton,
                  { backgroundColor: colors.primary },
                  isSubmitting && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign in</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.signupRow}>
              <Text style={[styles.signupText, { color: colors.textSecondary }]}>New to SecondBrain? </Text>
              <Link href="/signup" asChild>
                <Pressable accessibilityRole="button">
                  <Text style={[styles.signupLink, { color: colors.primary }]}>Create an account</Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboardArea: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  page: { width: '100%', maxWidth: 440, alignSelf: 'center', alignItems: 'center' },
  wordmark: { width: 210, height: 118 },
  wordmarkDark: { tintColor: '#ffffff' },
  title: { marginTop: 16, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { marginTop: 8, marginBottom: 28, fontSize: 15, lineHeight: 22, textAlign: 'center' },
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
  passwordLabel: { marginTop: 18 },
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
  optionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rememberButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 6,
  },
  optionText: { fontSize: 13 },
  link: { fontSize: 13, fontWeight: '700' },
  errorText: { marginTop: 16, color: '#d92d20', fontSize: 14, lineHeight: 20 },
  loginButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderRadius: 12,
  },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.65 },
  signupRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '800' },
});
