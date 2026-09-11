import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomNav } from '@/components/BottomNav';
import { useAppTheme } from '@/context/AppTheme';
import { useAuth } from '@/context/AuthContext';
import { AtlasLogo } from '@/components/ui/AtlasLogo';
import { SafeMarkdown } from '@/components/SafeMarkdown';
import { Check, ChevronDown, ChevronUp, History, Plus, Send, Trash2, X } from '@tamagui/lucide-icons-2';
import { Adapt, Select, Sheet, YStack } from 'tamagui';

type CourseOption = {
  id: number;
  name: string;
  semesterName: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  id: number;
  courseId: number;
  courseName: string;
  title: string;
  updatedAt: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: 'atlas-welcome',
  role: 'assistant',
  content: 'Hi! I’m **Atlas**. Choose a class and ask me what you would like to study.',
};

export default function AICompanionScreen() {
  const { colors } = useAppTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const db = useSQLiteContext();
  const chatScrollRef = useRef<ScrollView>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipNextCourseRestoreRef = useRef(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const selectedCourse = courses.find((course) => String(course.id) === selectedCourseId);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
  const courseContext = activeConversation
    ? { id: activeConversation.courseId, name: activeConversation.courseName }
    : selectedCourse;
  const canSend = message.trim().length > 0 && !!courseContext && !isSending && !isTyping;

  useEffect(() => () => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => chatScrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, isSending]);

  const stopTyping = () => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    typingIntervalRef.current = null;
    setIsTyping(false);
  };

  const typeAssistantMessage = (fullText: string, messageId: string) => {
    const id = messageId;
    let visibleCharacters = 0;

    setMessages((current) => [...current, { id, role: 'assistant', content: '' }]);
    setIsTyping(true);
    typingIntervalRef.current = setInterval(() => {
      visibleCharacters = Math.min(visibleCharacters + 3, fullText.length);
      setMessages((current) => current.map((item) => (
        item.id === id ? { ...item, content: fullText.slice(0, visibleCharacters) } : item
      )));

      if (visibleCharacters >= fullText.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsTyping(false);
      }
    }, 18);
  };

  const loadConversationList = useCallback(async () => {
    if (!userId) return [];
    const rows = await db.getAllAsync<Conversation>(`
      SELECT
        id,
        course_id AS courseId,
        course_name AS courseName,
        title,
        updated_at AS updatedAt
      FROM ai_conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC, id DESC
    `, userId);
    setConversations(rows);
    return rows;
  }, [db, userId]);

  const openConversation = useCallback(async (conversation: Conversation) => {
    stopTyping();
    setIsLoadingConversation(true);
    setError('');
    try {
      const savedMessages = await db.getAllAsync<{ id: number; role: 'user' | 'assistant'; content: string }>(`
        SELECT id, role, content
        FROM ai_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC, id ASC
      `, conversation.id);
      setMessages(savedMessages.map((item) => ({ ...item, id: String(item.id) })));
      setActiveConversationId(conversation.id);
      if (selectedCourseId !== String(conversation.courseId)) {
        skipNextCourseRestoreRef.current = true;
      }
      setSelectedCourseId(String(conversation.courseId));
      setIsHistoryOpen(false);
    } catch {
      setError('Unable to load this conversation.');
    } finally {
      setIsLoadingConversation(false);
    }
  }, [db, selectedCourseId]);

  const startNewChat = () => {
    stopTyping();
    setActiveConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setMessage('');
    setError('');
    setIsHistoryOpen(false);
    if (!courses.some((course) => String(course.id) === selectedCourseId) && courses[0]) {
      skipNextCourseRestoreRef.current = true;
      setSelectedCourseId(String(courses[0].id));
    }
  };

  const deleteConversation = (conversation: Conversation) => {
    Alert.alert(
      'Delete conversation?',
      `“${conversation.title}” will be permanently removed from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await db.runAsync('DELETE FROM ai_conversations WHERE id = ? AND user_id = ?', conversation.id, userId ?? '');
                const remaining = await loadConversationList();
                if (activeConversationId === conversation.id) {
                  const nextConversation = remaining[0];
                  if (nextConversation) await openConversation(nextConversation);
                  else startNewChat();
                }
              } catch {
                setError('Unable to delete the conversation.');
              }
            })();
          },
        },
      ]
    );
  };

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

  useEffect(() => {
    if (!userId || !selectedCourseId) return;
    if (skipNextCourseRestoreRef.current) {
      skipNextCourseRestoreRef.current = false;
      return;
    }
    let isActive = true;

    const restoreLatestConversation = async () => {
      setIsLoadingConversation(true);
      try {
        const savedConversations = await loadConversationList();
        if (!isActive) return;
        const latestForCourse = savedConversations.find(
          (conversation) => conversation.courseId === Number(selectedCourseId)
        );

        if (!latestForCourse) {
          setActiveConversationId(null);
          setMessages([WELCOME_MESSAGE]);
          return;
        }

        const savedMessages = await db.getAllAsync<{ id: number; role: 'user' | 'assistant'; content: string }>(`
          SELECT id, role, content
          FROM ai_messages
          WHERE conversation_id = ?
          ORDER BY created_at ASC, id ASC
        `, latestForCourse.id);
        if (!isActive) return;
        setActiveConversationId(latestForCourse.id);
        setMessages(savedMessages.map((item) => ({ ...item, id: String(item.id) })));
      } catch {
        if (isActive) setError('Unable to restore your conversation history.');
      } finally {
        if (isActive) setIsLoadingConversation(false);
      }
    };

    void restoreLatestConversation();
    return () => {
      isActive = false;
    };
  }, [db, loadConversationList, selectedCourseId, userId]);

  const renderCourseValue = useCallback(
    (value: string) => courses.find((course) => String(course.id) === value)?.name
      ?? conversations.find((conversation) => String(conversation.courseId) === value)?.courseName,
    [conversations, courses]
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
    if (!canSend || !courseContext || !userId) return;

    const prompt = message.trim();
    const defaultApiUrl = Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'
      : 'http://127.0.0.1:8000';
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl;
    const recentHistory = messages
      .filter((item) => item.id !== WELCOME_MESSAGE.id && item.content.trim())
      .slice(-20)
      .map(({ role, content }) => ({ role, content }));

    const temporaryMessageId = `user-${Date.now()}`;
    setMessages((current) => [...current, { id: temporaryMessageId, role: 'user', content: prompt }]);
    setMessage('');
    setIsSending(true);
    setError('');

    try {
      const now = new Date().toISOString();
      let conversationId = activeConversationId;

      if (!conversationId) {
        const title = prompt.replace(/\s+/g, ' ').slice(0, 60) || 'New conversation';
        const conversationResult = await db.runAsync(`
          INSERT INTO ai_conversations
            (user_id, course_id, course_name, title, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, userId, courseContext.id, courseContext.name, title, now, now);
        conversationId = conversationResult.lastInsertRowId;
        setActiveConversationId(conversationId);
      }

      const userMessageResult = await db.runAsync(`
        INSERT INTO ai_messages (conversation_id, role, content, created_at)
        VALUES (?, 'user', ?, ?)
      `, conversationId, prompt, now);
      setMessages((current) => current.map((item) => (
        item.id === temporaryMessageId ? { ...item, id: String(userMessageResult.lastInsertRowId) } : item
      )));
      await db.runAsync(
        'UPDATE ai_conversations SET updated_at = ? WHERE id = ? AND user_id = ?',
        now,
        conversationId,
        userId
      );
      await loadConversationList();

      const result = await fetch(`${apiUrl}/api/assistant/respond/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, course: courseContext.name, history: recentHistory }),
      });
      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error ?? 'Atlas could not answer right now.');
      }

      if (typeof data.response !== 'string' || !data.response.trim()) {
        throw new Error('Atlas returned an empty response.');
      }

      const responseTime = new Date().toISOString();
      const assistantMessageResult = await db.runAsync(`
        INSERT INTO ai_messages (conversation_id, role, content, created_at)
        VALUES (?, 'assistant', ?, ?)
      `, conversationId, data.response, responseTime);
      await db.runAsync(
        'UPDATE ai_conversations SET updated_at = ? WHERE id = ? AND user_id = ?',
        responseTime,
        conversationId,
        userId
      );
      await loadConversationList();
      typeAssistantMessage(data.response, String(assistantMessageResult.lastInsertRowId));
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
          <View style={[styles.chatHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <AtlasLogo />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Study companion</Text>
              <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>Online · Here to help you learn</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start a new conversation"
                onPress={startNewChat}
                style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.activeSurface }, pressed && styles.sendButtonPressed]}
              >
                <Plus size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open conversation history"
                onPress={() => {
                  void loadConversationList();
                  setIsHistoryOpen(true);
                }}
                style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.activeSurface }, pressed && styles.sendButtonPressed]}
              >
                <History size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>
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
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          >
            {isLoadingConversation && (
              <ActivityIndicator style={styles.restoreSpinner} color={colors.primary} />
            )}
            {messages.map((item) => {
              const isUser = item.role === 'user';
              return (
                <View key={item.id} style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
                  {!isUser && (
                    <View style={[styles.atlasAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.atlasAvatarText}>A</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isUser
                        ? [styles.userBubble, { backgroundColor: colors.primary }]
                        : [styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
                    ]}
                  >
                    {isUser ? (
                      <Text style={styles.userMessageText}>{item.content}</Text>
                    ) : item.content ? (
                      <SafeMarkdown content={item.content} />
                    ) : (
                      <TypingDots color={colors.textSecondary} />
                    )}
                  </View>
                </View>
              );
            })}

            {isSending && (
              <View style={[styles.messageRow, styles.assistantRow]}>
                <View style={[styles.atlasAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.atlasAvatarText}>A</Text>
                </View>
                <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>Atlas is thinking…</Text>
                  </View>
                </View>
              </View>
            )}

            {!!error && (
              <View style={[styles.errorBubble, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            )}
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
      <Modal
        visible={isHistoryOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsHistoryOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsHistoryOpen(false)}>
          <Pressable
            style={[styles.historySheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={[styles.historyHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.historyTitle, { color: colors.text }]}>Conversations</Text>
                <Text style={[styles.historySubtitle, { color: colors.textSecondary }]}>Saved on this device</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close history" onPress={() => setIsHistoryOpen(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={startNewChat}
              style={({ pressed }) => [styles.newChatButton, { backgroundColor: colors.primary }, pressed && styles.sendButtonPressed]}
            >
              <Plus size={19} color="#ffffff" />
              <Text style={styles.newChatText}>New chat</Text>
            </Pressable>

            <ScrollView style={styles.historyList} contentContainerStyle={styles.historyListContent}>
              {conversations.length === 0 ? (
                <Text style={[styles.emptyHistory, { color: colors.textSecondary }]}>Your saved conversations will appear here.</Text>
              ) : conversations.map((conversation) => (
                <View
                  key={conversation.id}
                  style={[
                    styles.historyItem,
                    { borderColor: colors.border },
                    activeConversationId === conversation.id && { backgroundColor: colors.activeSurface },
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void openConversation(conversation)}
                    style={({ pressed }) => [styles.historyItemMain, pressed && styles.sendButtonPressed]}
                  >
                    <Text numberOfLines={1} style={[styles.historyItemTitle, { color: colors.text }]}>{conversation.title}</Text>
                    <Text numberOfLines={1} style={[styles.historyItemMeta, { color: colors.textSecondary }]}>
                      {conversation.courseName} · {new Date(conversation.updatedAt).toLocaleDateString()}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${conversation.title}`}
                    hitSlop={8}
                    onPress={() => deleteConversation(conversation)}
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.sendButtonPressed]}
                  >
                    <Trash2 size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <BottomNav />
    </SafeAreaView>
  );
}

function TypingDots({ color }: { color: string }) {
  return <Text style={[styles.typingDots, { color }]}>•••</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboardArea: { flex: 1 },
  content: { flex: 1 },
  chatHeader: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1, marginLeft: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerStatus: { marginTop: 3, fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  courseSection: { width: '100%', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14 },
  courseLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  noCoursesText: { fontSize: 14, lineHeight: 20 },
  chatArea: { flex: 1, width: '100%' },
  chatContent: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 20 },
  restoreSpinner: { marginVertical: 16 },
  messageRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  assistantRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  atlasAvatar: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 15,
  },
  atlasAvatarText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  messageBubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10 },
  assistantBubble: { borderWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 5, borderBottomRightRadius: 18 },
  userBubble: { borderTopLeftRadius: 18, borderTopRightRadius: 5, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  userMessageText: { color: '#ffffff', fontSize: 16, lineHeight: 23 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinkingText: { fontSize: 14 },
  typingDots: { minWidth: 30, fontSize: 20, lineHeight: 22, letterSpacing: 3 },
  errorBubble: { alignSelf: 'center', maxWidth: '88%', paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderRadius: 12 },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  historySheet: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '78%',
    minHeight: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  historyTitle: { fontSize: 22, fontWeight: '800' },
  historySubtitle: { marginTop: 3, fontSize: 13 },
  newChatButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, borderRadius: 12 },
  newChatText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  historyList: { flex: 1 },
  historyListContent: { paddingHorizontal: 16, paddingBottom: 28 },
  emptyHistory: { paddingVertical: 40, paddingHorizontal: 20, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  historyItem: { minHeight: 68, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderRadius: 14 },
  historyItemMain: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 12 },
  historyItemTitle: { fontSize: 15, fontWeight: '700' },
  historyItemMeta: { marginTop: 5, fontSize: 12 },
  deleteButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
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
