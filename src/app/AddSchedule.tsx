import React, { useState } from 'react';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { isWeb, XStack, YStack, createCheckbox, styled } from 'tamagui';
import { Toast, toast, type ToastT } from '@tamagui/toast/v2';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomNav } from '@/components/BottomNav';
import { useAppTheme } from '@/context/AppTheme';
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
  const { colors } = useAppTheme();
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
      await db.withExclusiveTransactionAsync(async (transaction) => {
        const scheduleResult = await transaction.runAsync(
          'INSERT INTO schedules (semester_name, created_at) VALUES (?, ?)',
          trimmedSemesterName,
          new Date().toISOString()
        );
        const classStatement = await transaction.prepareAsync(
          `INSERT INTO classes
            (schedule_id, name, hours, professor, description, days, location)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        try {
          for (const classCard of scheduleClasses) {
            await classStatement.executeAsync(
              scheduleResult.lastInsertRowId,
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
      });

      console.log(
        `Schedule saved: ${scheduleClasses.length} class(es) saved successfully.`
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
                Add Schedule
              </Animated.Text>
            </Animated.View>
            <Animated.View style={[styles.formContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} entering={FadeIn.duration(800)} exiting={FadeOut.duration(500)}>
              <Text style={[styles.subtitle, { color: colors.text }]}>Enter the details of the new schedule:</Text>
              <Text style={[styles.label, { color: colors.text }]}>Semester Name</Text>
              <TextInput
                style={themedInput}
                value={semesterName}
                onChangeText={setSemesterName}
                placeholderTextColor={colors.textSecondary}
              />

              <Pressable style={styles.AddButton} onPress={addClassCard}>
                <Text style={styles.buttonText}>Add Class</Text>
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
                    style={styles.deleteButton}
                    onPress={() => deleteClassCard(classCard.id)}
                  >
                    <Text style={styles.buttonText}>Delete Class</Text>
                  </Pressable>
                </Animated.View>
              ))}

              <Pressable style={styles.createButton} onPress={createClassObjects}>
                <Text style={styles.buttonText}>Create Schedule</Text>
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
  AddButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
  },
  createButton: {
    backgroundColor: '#1B8A5A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
  },
  deleteButton: {
    backgroundColor: '#D64545',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
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
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
