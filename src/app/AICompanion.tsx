import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BottomNav } from '@/components/BottomNav';
import { useAppTheme } from '@/context/AppTheme';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import { Send } from '@tamagui/lucide-icons-2';

export default function AICompanionScreen() {
  const { colors } = useAppTheme();
  const [message, setMessage] = useState('');
  const canSend = message.trim().length > 0;

  const sendMessage = () => {
    if (!canSend) return;
    console.log('Atlas message:', message.trim());
    setMessage('');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={styles.content} entering={FadeIn}>
          <AtlasLogo />
          <Text style={[styles.AtlasExplanation, { color: colors.text }]}> 
            Atlas is your AI study companion, helping you stay organized, understand your work, and reach your goals—without doing assignments for you.
          </Text>
        </Animated.View>

        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Ask Atlas anything..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!canSend}
            onPress={sendMessage}
            style={({ pressed }) => [
              styles.sendButton,
              { backgroundColor: colors.primary },
              !canSend && styles.sendButtonDisabled,
              pressed && canSend && styles.sendButtonPressed,
            ]}
          >
            <Send size={19} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboardArea: { flex: 1 },
  content: { flex: 1 },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'left'},
  AtlasExplanation: { fontSize: 16, lineHeight: 24, padding: 24 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderRadius: 18,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonPressed: { opacity: 0.75, transform: [{ scale: 0.94 }] },
});
