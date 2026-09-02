import React, { useEffect, useState } from 'react';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Platform, View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { isWeb, XStack, YStack, createCheckbox, styled } from 'tamagui';
import { Toast, toast, type ToastT } from '@tamagui/toast/v2';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomNav } from '@/components/BottomNav';
import { useAppTheme } from '@/context/AppTheme';
import { CalendarPlus, Save, Trash2 } from '@tamagui/lucide-icons-2';
interface ClassDescription {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  professor: string;
  description: string;
  days: string;
  location: string;
}
const CheckboxFrame = styled(YStack, {
  width: 28,
  height: 28,
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: 5,
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    checked: {
      indeterminate: {},
      true: {
        backgroundColor: '#20084f',
      },
      false: {
        backgroundColor: 'white',
      },
    },
  } as const,

  defaultVariants: {
    checked: false,
  },
});

const CheckboxIndicator = styled(YStack, {
  alignItems: 'center',
  justifyContent: 'center',
});

const DayCheckbox = createCheckbox({
  Frame: CheckboxFrame,
  Indicator: CheckboxIndicator,
});

const DAYS = [
  { label: 'M', value: 'M' },
  { label: 'T', value: 'T' },
  { label: 'W', value: 'W' },
  { label: 'TH', value: 'TH' },
  { label: 'F', value: 'F' },
  { label: 'SA', value: 'SA' },
  { label: 'SU', value: 'SU' },
] as const;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
});

export default function AddSchedule() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { scheduleId } = useLocalSearchParams<{ scheduleId?: string }>();
  const editingScheduleId = scheduleId ? Number(scheduleId) : null;
  const isEditing = editingScheduleId !== null && Number.isInteger(editingScheduleId);
  const { colors, isDark } = useAppTheme();
  const themedInput = [
    styles.input,
    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text },
  ];
  const [classes, setClasses] = useState<ClassDescription[]>([]);
  const [createdClasses, setCreatedClasses] = useState<ClassDescription[]>([]);
  const [semesterName, setSemesterName] = useState('');
  const [openTimePicker, setOpenTimePicker] = useState<{
    classId: number;
    field: 'startTime' | 'endTime';
  } | null>(null);

  useEffect(() => {
    if (!isEditing) return;

    let active = true;

    const loadSchedule = async () => {
      const schedule = await db.getFirstAsync<{ semester_name: string }>(
        'SELECT semester_name FROM schedules WHERE id = ?',
        editingScheduleId
      );
      const savedClasses = await db.getAllAsync<{
        id: number;
        name: string;
        hours: string;
        professor: string;
        description: string | null;
        days: string;
        location: string;
      }>(
        `SELECT id, name, hours, professor, description, days, location
         FROM classes
         WHERE schedule_id = ?
         ORDER BY name ASC`,
        editingScheduleId
      );

      if (!active) return;

      if (!schedule) {
        toast('Semester not found', {
          description: 'The semester may have already been deleted.',
        });
        router.replace('/');
        return;
      }

      setSemesterName(schedule.semester_name);
      setClasses(savedClasses.map((classItem) => {
        const [startTime = '', endTime = ''] = classItem.hours.split(' - ');
        return {
          id: classItem.id,
          name: classItem.name,
          startTime,
          endTime,
          professor: classItem.professor,
          description: classItem.description ?? '',
          days: classItem.days,
          location: classItem.location,
        };
      }));
    };

    void loadSchedule().catch((error) => {
      console.error('Failed to load semester for editing:', error);
      toast('Semester not loaded', {
        description: 'An error occurred while loading the semester.',
      });
    });

    return () => {
      active = false;
    };
  }, [db, editingScheduleId, isEditing, router]);

  const toggleClassDay = (
    classId: number,
    day: (typeof DAYS)[number]['value']
  ) => {
    setClasses((currentClasses) =>
      currentClasses.map((classCard) => {
        if (classCard.id !== classId) {
          return classCard;
        }

        const selectedDays = classCard.days
          .split(',')
          .filter(Boolean);

        const nextDays = selectedDays.includes(day)
          ? selectedDays.filter((selectedDay) => selectedDay !== day)
          : [...selectedDays, day];

        return {
          ...classCard,
          days: nextDays.join(','),
        };
      })
    );
  };

  const isClassCardComplete = (classCard: ClassDescription) =>
    classCard.name.trim().length > 0 &&
    classCard.startTime.trim().length > 0 &&
    classCard.endTime.trim().length > 0 &&
    classCard.professor.trim().length > 0 &&
    classCard.days.trim().length > 0 &&
    classCard.location.trim().length > 0;

  const addClassCard = () => {
    const currentClass = classes[classes.length - 1];

    if (currentClass && !isClassCardComplete(currentClass)) {
      toast('Finish the current class', {
        description: 'Fill in every required field before adding another class.',
      });
      return;
    }

    setClasses((currentClasses) => [
      ...currentClasses,
      {
        id: Date.now(),
        name: '',
        startTime: '',
        endTime: '',
        professor: '',
        description: '',
        days: '',
        location: '',
      },
    ]);
  };

  const updateClassCard = (
    id: number,
    field: keyof Omit<ClassDescription, 'id'>,
    value: string
  ) => {
    setClasses((currentClasses) =>
      currentClasses.map((classCard) =>
        classCard.id === id ? { ...classCard, [field]: value } : classCard
      )
    );
  };

  const deleteClassCard = (id: number) => {
    setClasses((currentClasses) =>
      currentClasses.filter((classCard) => classCard.id !== id)
    );
    setCreatedClasses((currentClasses) =>
      currentClasses.filter((classCard) => classCard.id !== id)
    );
  };

  const createClassObjects = async () => {
    if (classes.length === 0) {
      toast('Class not created', {
        description: 'Add at least one class first.',
      });
      return;
    }

    const incompleteClass = classes.find(
      (classCard) => !isClassCardComplete(classCard)
    );

    if (incompleteClass) {
      toast('Class not created', {
        description: 'Fill in all required fields before creating the schedule.',
      });
      return;
    }

    const completedClasses = classes.map((classCard) => ({
      ...classCard,
      name: classCard.name.trim(),
      startTime: classCard.startTime.trim(),
      endTime: classCard.endTime.trim(),
      professor: classCard.professor.trim(),
      description: classCard.description.trim(),
      days: classCard.days.trim(),
      location: classCard.location.trim(),
    }));

    setCreatedClasses(completedClasses);
    await saveScheduleToDatabase(completedClasses);
  };

  const saveScheduleToDatabase = async (scheduleClasses = createdClasses) => {
    const trimmedSemesterName = semesterName.trim();

    if (!trimmedSemesterName || scheduleClasses.length === 0) {
      toast('Schedule not saved', {
        description: 'Enter a semester name and add at least one class.',
      });
      return;
    }

    try {
      let savedScheduleId: number | null = null;
      const saveSchedule = async (transaction = db) => {
        if (isEditing) {
          savedScheduleId = editingScheduleId;
          await transaction.runAsync(
            'UPDATE schedules SET semester_name = ? WHERE id = ?',
            trimmedSemesterName,
            editingScheduleId
          );
          await transaction.runAsync(
            'DELETE FROM classes WHERE schedule_id = ?',
            editingScheduleId
          );
        } else {
          const scheduleResult = await transaction.runAsync(
            'INSERT INTO schedules (semester_name, created_at) VALUES (?, ?)',
            trimmedSemesterName,
            new Date().toISOString()
          );
          savedScheduleId = scheduleResult.lastInsertRowId;
        }

        const classStatement = await transaction.prepareAsync(
          `INSERT INTO classes
            (schedule_id, name, hours, professor, description, days, location)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        try {
          for (const classCard of scheduleClasses) {
            await classStatement.executeAsync(
              savedScheduleId,
              classCard.name,
              `${classCard.startTime} - ${classCard.endTime}`,
              classCard.professor,
              classCard.description,
              classCard.days,
              classCard.location
            );
          }
        } finally {
          await classStatement.finalizeAsync();
        }
      };

      if (Platform.OS === 'web') {
        await db.withTransactionAsync(() => saveSchedule(db));
      } else {
        await db.withExclusiveTransactionAsync(saveSchedule);
      }

      const savedClassCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM classes WHERE schedule_id = ?',
        savedScheduleId
      );

      if (savedClassCount?.count !== scheduleClasses.length) {
        throw new Error('The saved class count did not match the submitted classes.');
      }

      console.log(
        `Schedule ${isEditing ? 'updated' : 'created'}: ${scheduleClasses.length} class(es) saved successfully.`
      );
      router.replace('/');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast('Schedule not saved', {
        description: 'An error occurred while saving the schedule.',
      });
    }
  };

  return (
    <Toast position="top-center" duration={4000} gap={12} visibleToasts={3}>
      <Toast.Viewport offset={50}>
        <Toast.List
          renderItem={({ toast: currentToast, index }) => (
            <Toast.Item key={currentToast.id} toast={currentToast} index={index}>
              <ToastContent toast={currentToast} />
            </Toast.Item>
          )}
        />
      </Toast.Viewport>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View style={[styles.shadowContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} entering={FadeIn.duration(800)}>
              <Animated.Text
                style={[styles.text, { color: colors.text }]}
                entering={FadeIn.duration(1200)}
                exiting={FadeOut.duration(500)}
              >
                {isEditing ? 'Edit Schedule' : 'Add Schedule'}
              </Animated.Text>
            </Animated.View>
            <Animated.View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} entering={FadeIn.duration(800)} exiting={FadeOut.duration(500)}>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                {isEditing
                  ? 'Update the semester and its classes:'
                  : 'Enter the details of the new schedule:'}
              </Text>
              <Text style={[styles.label, { color: colors.text }]}>Semester Name</Text>
              <TextInput
                style={themedInput}
                value={semesterName}
                onChangeText={setSemesterName}
                placeholderTextColor={colors.textSecondary}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.addButton,
                  {
                    backgroundColor: colors.activeSurface,
                    borderColor: colors.primary,
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={addClassCard}
              >
                <CalendarPlus size={19} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Add Class</Text>
              </Pressable>
              {classes.map((classCard) => (
                <Animated.View
                  key={classCard.id}
                  style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  entering={FadeInDown.duration(250)}
                  exiting={FadeOut.duration(200)}
                  layout={LinearTransition.duration(250)}
                >
                  <Text style={[styles.label, { color: colors.text }]}>Class Name</Text>
                  <TextInput
                    style={themedInput}
                    value={classCard.name}
                    onChangeText={(text) => updateClassCard(classCard.id, 'name', text)}
                  />
                  <Text style={[styles.label, { color: colors.text }]}>Hours</Text>
                  <Pressable
                    style={themedInput}
                    onPress={() =>
                      setOpenTimePicker((currentPicker) =>
                        currentPicker?.classId === classCard.id &&
                        currentPicker.field === 'startTime'
                          ? null
                          : { classId: classCard.id, field: 'startTime' }
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Choose class time"
                  >
                    <Text style={[classCard.startTime ? styles.timeText : styles.timePlaceholder, { color: classCard.startTime ? colors.text : colors.textSecondary }]}>
                      {classCard.startTime || 'Start Time'}
                    </Text>
                  </Pressable>
                  {openTimePicker?.classId === classCard.id &&
                    openTimePicker.field === 'startTime' && (
                    <ScrollView
                      style={[styles.timePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <Pressable
                          key={time}
                          style={[
                            styles.timeOption,
                            classCard.startTime === time && styles.selectedTimeOption,
                          ]}
                          onPress={() => {
                            updateClassCard(classCard.id, 'startTime', time);
                            setOpenTimePicker(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.timeText,
                              { color: colors.text },
                              classCard.startTime === time && styles.selectedTimeText,
                            ]}
                          >
                            {time}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                  <Pressable
                    style={themedInput}
                    onPress={() =>
                      setOpenTimePicker((currentPicker) =>
                        currentPicker?.classId === classCard.id &&
                        currentPicker.field === 'endTime'
                          ? null
                          : { classId: classCard.id, field: 'endTime' }
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Choose class time"
                  >
                    <Text style={[classCard.endTime ? styles.timeText : styles.timePlaceholder, { color: classCard.endTime ? colors.text : colors.textSecondary }]}>
                      {classCard.endTime || 'End Time'}
                    </Text>
                  </Pressable>
                  {openTimePicker?.classId === classCard.id &&
                    openTimePicker.field === 'endTime' && (
                    <ScrollView
                      style={[styles.timePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <Pressable
                          key={time}
                          style={[
                            styles.timeOption,
                            classCard.endTime === time && styles.selectedTimeOption,
                          ]}
                          onPress={() => {
                            updateClassCard(classCard.id, 'endTime', time);
                            setOpenTimePicker(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.timeText,
                              { color: colors.text },
                              classCard.endTime === time && styles.selectedTimeText,
                            ]}
                          >
                            {time}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                  <Text style={[styles.label, { color: colors.text }]}>Days</Text>
                  <View style={styles.daysContainer}>

                    <XStack justifyContent="space-between">
                      {DAYS.map((day) => {
                        const selectedDays = classCard.days
                          .split(',')
                          .filter(Boolean);

                        const isChecked = selectedDays.includes(day.value);

                        return (
                          <YStack
                            key={day.value}
                            alignItems="center"
                            gap="$1"
                          >
                            <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day.label}</Text>

                            <DayCheckbox
                              id={`${classCard.id}-${day.value}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (typeof checked === 'boolean') {
                                  toggleClassDay(classCard.id, day.value);
                                }
                              }}
                              aria-label={`${day.label} class day`}
                            />
                          </YStack>
                        );
                      })}
                    </XStack>
                  </View>
                  <Text style={[styles.label, { color: colors.text }]}>Professor</Text>
                  <TextInput
                    style={themedInput}
                    value={classCard.professor}
                    onChangeText={(text) => updateClassCard(classCard.id, 'professor', text)}
                  />
                  <Text style={[styles.label, { color: colors.text }]}>Location</Text>
                  <TextInput
                    style={themedInput}
                    value={classCard.location}
                    onChangeText={(text) => updateClassCard(classCard.id, 'location', text)}
                  />
                  <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                  <TextInput
                    style={[themedInput, styles.descriptionInput]}
                    multiline
                    value={classCard.description}
                    onChangeText={(text) => updateClassCard(classCard.id, 'description', text)}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.deleteButton,
                      {
                        backgroundColor: isDark ? '#3b2022' : '#fff1f0',
                        borderColor: colors.danger,
                      },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => deleteClassCard(classCard.id)}
                  >
                    <Trash2 size={18} color={colors.danger} />
                    <Text style={[styles.actionButtonText, { color: colors.danger }]}>Delete Class</Text>
                  </Pressable>
                </Animated.View>
              ))}

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.createButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.buttonPressed,
                ]}
                onPress={createClassObjects}
              >
                <Save size={19} color="#fff" />
                <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                  {isEditing ? 'Save Changes' : 'Create Schedule'}
                </Text>
              </Pressable>

              {createdClasses.length > 0 && (
                <Text style={styles.createdText}>
                  {createdClasses.length} class(es) saved.
                </Text>
              )}
            </Animated.View>
          </ScrollView>
        </View>
        <BottomNav />
      </SafeAreaView>
    </Toast>
  );
}

function ToastContent({ toast: currentToast }: { toast: ToastT }) {
  const title =
    typeof currentToast.title === 'function'
      ? currentToast.title()
      : currentToast.title;
  const description =
    typeof currentToast.description === 'function'
      ? currentToast.description()
      : currentToast.description;

  return (
    <XStack gap="$3" alignItems="flex-start">
      <Toast.Icon />
      <YStack flex={1} gap="$1">
        {title && <Toast.Title fontWeight="600">{title}</Toast.Title>}
        {description && (
          <Toast.Description color="$color9">{description}</Toast.Description>
        )}
      </YStack>
      {isWeb && <Toast.Close />}
    </XStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  shadowContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 16,
  },
  daysContainer: {
    marginBottom: 12,
  },

  daysTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  dayLabel: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },

  formContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
  },
  text: {
    color: 'black',
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    marginTop: 16
  },
  label: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
  },
  descriptionInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  timePlaceholder: {
    color: '#777',
  },
  timeText: {
    color: '#222',
    fontSize: 16,
  },
  timePicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedTimeOption: {
    backgroundColor: '#20084f',
  },
  selectedTimeText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  actionButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  addButton: {
    marginBottom: 16,
  },
  createButton: {
    marginBottom: 16,
    borderColor: 'transparent',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  deleteButton: {
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#fff',
  },
  createdText: {
    color: '#1B8A5A',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
  },
});
