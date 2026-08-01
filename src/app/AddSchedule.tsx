import React, { useState } from 'react';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { isWeb, XStack, YStack, createCheckbox, styled } from 'tamagui';
import { Toast, toast, type ToastT } from '@tamagui/toast/v2';
interface ClassDescription {
  id: number;
  name: string;
  hours: string;
  professor: string;
  description: string;
  days: string;
  location: string;
  credits: string;
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

export default function AddSchedule() {
  const [classes, setClasses] = useState<ClassDescription[]>([]);
  const [createdClasses, setCreatedClasses] = useState<ClassDescription[]>([]);

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
    classCard.hours.trim().length > 0 &&
    classCard.professor.trim().length > 0 &&
    classCard.days.trim().length > 0 &&
    classCard.location.trim().length > 0 &&
    classCard.credits.trim().length > 0;

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
        hours: '',
        professor: '',
        description: '',
        days: '',
        location: '',
        credits: '',
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

  const createClassObjects = () => {
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
      hours: classCard.hours.trim(),
      professor: classCard.professor.trim(),
      description: classCard.description.trim(),
      days: classCard.days.trim(),
      location: classCard.location.trim(),
    }));

    setCreatedClasses(completedClasses);
    console.log('Created class objects:', completedClasses);

    toast('Schedule created', {
      description: `${completedClasses.length} class(es) created successfully.`,
    });
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

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.shadowContainer}>
              <Animated.Text
                style={styles.text}
                entering={FadeIn.duration(1200)}
                exiting={FadeOut.duration(500)}
              >
                Add Schedule
              </Animated.Text>
            </View>
            <Animated.View style={styles.formContainer} entering={FadeIn.duration(800)} exiting={FadeOut.duration(500)}>
              <Text style={styles.subtitle}>Enter the details of the new schedule:</Text>
              <Text style={styles.label}>Semester Name</Text>
              <TextInput style={styles.input}/>

              <Pressable style={styles.AddButton} onPress={addClassCard}>
                <Text style={styles.buttonText}>Add Class</Text>
              </Pressable>
              {classes.map((classCard) => (
                <Animated.View
                  key={classCard.id}
                  style={styles.card}
                  entering={FadeInDown.duration(250)}
                  exiting={FadeOut.duration(200)}
                  layout={LinearTransition.duration(250)}
                >
                  <Text style={styles.label}>Class Name</Text>
                  <TextInput
                    style={styles.input}
                    value={classCard.name}
                    onChangeText={(text) => updateClassCard(classCard.id, 'name', text)}
                  />
                  <Text style={styles.label}>Hours</Text>
                  <TextInput
                    style={styles.input}
                    value={classCard.hours}
                    onChangeText={(text) => updateClassCard(classCard.id, 'hours', text)}
                  />
                  <Text style={styles.label}>Days</Text>
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
                            <Text style={styles.dayLabel}>{day.label}</Text>

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
                  <Text style={styles.label}>Professor</Text>
                  <TextInput
                    style={styles.input}
                    value={classCard.professor}
                    onChangeText={(text) => updateClassCard(classCard.id, 'professor', text)}
                  />
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={classCard.location}
                    onChangeText={(text) => updateClassCard(classCard.id, 'location', text)}
                  />
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.descriptionInput]}
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
                  {createdClasses.length} class object(s) ready.
                </Text>
              )}
            </Animated.View>
          </ScrollView>

          <Link href="/" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Go Back</Text>
            </Pressable>
          </Link>
        </View>
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
  button: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 'auto',
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
