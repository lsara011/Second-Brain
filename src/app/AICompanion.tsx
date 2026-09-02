import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomNav } from '@/components/BottomNav';
import { useAppTheme } from '@/context/AppTheme';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import { Check, ChevronDown, ChevronUp, Send } from '@tamagui/lucide-icons-2';
import { Adapt, Select, Sheet, YStack } from 'tamagui';

type CourseOption = {
  id: number;
  name: string;
  semesterName: string;
};

export default function AICompanionScreen() {
  const { colors } = useAppTheme();
  const db = useSQLiteContext();
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const selectedCourse = courses.find((course) => String(course.id) === selectedCourseId);
  const canSend = message.trim().length > 0 && !!selectedCourse && !isSending;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadCurrentSemesterCourses = async () => {
        try {
          const rows = await db.getAllAsync<CourseOption>(`
            SELECT
              classes.id,
              classes.name,
              schedules.semester_name AS semesterName
            FROM classes
            JOIN schedules ON schedules.id = classes.schedule_id
            WHERE schedules.id = (
              SELECT id
              FROM schedules
              ORDER BY created_at DESC, id DESC
              LIMIT 1
            )
            ORDER BY classes.name ASC
          `);

          if (!isActive) return;
          setCourses(rows);
          setSelectedCourseId((current) =>
            rows.some((course) => String(course.id) === current)
              ? current
              : rows[0]
                ? String(rows[0].id)
                : ''
          );
        } catch {
          if (isActive) setError('Unable to load your current semester classes.');
        }
      };

      void loadCurrentSemesterCourses();
      return () => {
        isActive = false;
      };
    }, [db])
  );

  const renderCourseValue = useCallback(
    (value: string) => courses.find((course) => String(course.id) === value)?.name,
    [courses]
  );

  const courseItems = useMemo(
    () => courses.map((course, index) => (
      <Select.Item index={index} key={course.id} value={String(course.id)}>
        <Select.ItemText>{course.name}</Select.ItemText>
        <Select.ItemIndicator marginLeft="auto">
          <Check size={16} />
        </Select.ItemIndicator>
      </Select.Item>
    )),
    [courses]
  );

  const sendMessage = async () => {
    if (!canSend) return;

    const prompt = message.trim();
    const defaultApiUrl = Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'
      : 'http://127.0.0.1:8000';
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl;

    setIsSending(true);
    setError('');

    try {
      const result = await fetch(`${apiUrl}/api/assistant/respond/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, course: selectedCourse.name }),
      });
      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error ?? 'Atlas could not answer right now.');
      }

      setResponse(data.response);
      setMessage('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to reach Atlas.');
    } finally {
      setIsSending(false);
    }
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
          <View style={styles.courseSection}>
            <Text style={[styles.courseLabel, { color: colors.textSecondary }]}>Study topic</Text>
            {courses.length > 0 ? (
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
                disablePreventBodyScroll
                renderValue={renderCourseValue}
              >
                <Select.Trigger
                  width="100%"
                  iconAfter={ChevronDown}
                  borderRadius="$4"
                  backgroundColor={colors.surface}
                  borderColor={colors.border}
                >
                  <Select.Value placeholder="Choose a class" />
                </Select.Trigger>

                <Adapt when="md" platform="touch">
                  <Sheet modal dismissOnSnapToBottom transition="medium">
                    <Sheet.Frame backgroundColor={colors.surface}>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay
                      backgroundColor="$shadowColor"
                      transition="lazy"
                      enterStyle={{ opacity: 0 }}
                      exitStyle={{ opacity: 0 }}
                    />
                  </Sheet>
                </Adapt>

                <Select.Content>
                  <Select.ScrollUpButton alignItems="center" justifyContent="center" height="$3">
                    <YStack><ChevronUp size={20} /></YStack>
                  </Select.ScrollUpButton>
                  <Select.Viewport
                    minWidth={220}
                    backgroundColor={colors.surface}
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor={colors.border}
                  >
                    <Select.Group>
                      <Select.Label fontWeight="700">
                        {courses[0]?.semesterName ?? 'Current semester'}
                      </Select.Label>
                      {courseItems}
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton alignItems="center" justifyContent="center" height="$3">
                    <YStack><ChevronDown size={20} /></YStack>
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select>
            ) : (
              <Text style={[styles.noCoursesText, { color: colors.textSecondary }]}>Add a semester and classes to choose a study topic.</Text>
            )}
          </View>
          <ScrollView style={styles.responseArea} contentContainerStyle={styles.responseContent}>
            {isSending && <ActivityIndicator color={colors.primary} />}
            {!!response && <Text style={[styles.responseText, { color: colors.text }]}>{response}</Text>}
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>
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
  courseSection: { width: '100%', paddingHorizontal: 24, paddingBottom: 20 },
  courseLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  noCoursesText: { fontSize: 14, lineHeight: 20 },
  responseArea: { flex: 1, width: '100%' },
  responseContent: { paddingHorizontal: 24, paddingBottom: 24 },
  responseText: { fontSize: 16, lineHeight: 24 },
  errorText: { color: '#b42318', fontSize: 14, lineHeight: 20 },
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
