import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

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

export default function AddSchedule() {
  const [classes, setClasses] = useState<ClassDescription[]>([]);
  const [createdClasses, setCreatedClasses] = useState<ClassDescription[]>([]);

  const addClassCard = () => {
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
    const completedClasses = classes
      .map((classCard) => ({
        ...classCard,
        name: classCard.name.trim(),
        hours: classCard.hours.trim(),
        professor: classCard.professor.trim(),
        description: classCard.description.trim(),
        days: classCard.days.trim(),
        location: classCard.location.trim(),
        credits: classCard.credits.trim(),
      }))
      .filter((classCard) => classCard.name.length > 0);

    if (completedClasses.length === 0) {
      Alert.alert('Add a class', 'Create at least one class card with a class name first.');
      return;
    }

    setCreatedClasses(completedClasses);
    console.log('Created class objects:', completedClasses);
    Alert.alert('Schedule created', `${completedClasses.length} class object(s) created.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.shadowContainer}>
            <Text style={styles.text}>Add Schedule</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.subtitle}>Enter the details of the new schedule:</Text>
            <TextInput style={styles.input} placeholder="Semester Name" />

            <Pressable style={styles.AddButton} onPress={addClassCard}>
              <Text style={styles.buttonText}>Add Class</Text>
            </Pressable>

            {classes.map((classCard) => (
              <View key={classCard.id} style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="Class Name"
                value={classCard.name}
                onChangeText={(text) => updateClassCard(classCard.id, 'name', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Hours"
                value={classCard.hours}
                onChangeText={(text) => updateClassCard(classCard.id, 'hours', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Days"
                value={classCard.days}
                onChangeText={(text) => updateClassCard(classCard.id, 'days', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Professor"
                value={classCard.professor}
                onChangeText={(text) => updateClassCard(classCard.id, 'professor', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Location"
                value={classCard.location}
                onChangeText={(text) => updateClassCard(classCard.id, 'location', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Credits"
                keyboardType="numeric"
                value={classCard.credits}
                onChangeText={(text) => updateClassCard(classCard.id, 'credits', text)}
              />
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Description"
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
              </View>
            ))}

            <Pressable style={styles.createButton} onPress={createClassObjects}>
              <Text style={styles.buttonText}>Create Schedule</Text>
            </Pressable>

            {createdClasses.length > 0 && (
              <Text style={styles.createdText}>
                {createdClasses.length} class object(s) ready.
              </Text>
            )}
          </View>
        </ScrollView>

        <Link href="/" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
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
    shadowOffset: {width: 0, height: 6},
    marginBottom: 16,
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
    shadowOffset: {width: 0, height: 6},
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
    shadowOffset: {width: 0, height: 6},
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
    shadowOffset: {width: 0, height: 6},
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
    shadowOffset: {width: 0, height: 6},
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
    shadowOffset: {width: 0, height: 6},
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
    shadowOffset: {width: 0, height: 6},
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
    shadowOffset: {width: 0, height: 6},
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
