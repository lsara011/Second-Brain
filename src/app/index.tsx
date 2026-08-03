import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Avatar } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomNav } from '@/components/BottomNav';

interface ClassRow {
  schedule_id: number;
  semester_name: string;
  class_id: number | null;
  name: string | null;
  hours: string | null;
  professor: string | null;
  days: string | null;
  location: string | null;
}

interface Schedule {
  id: number;
  semesterName: string;
  classes: Omit<ClassRow, 'schedule_id' | 'semester_name'>[];
}

const MyComponent = () => <Avatar.Text size={24} label="LS" />;

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadSchedules = async () => {
        const rows = await db.getAllAsync<ClassRow>(`
          SELECT
            schedules.id AS schedule_id,
            schedules.semester_name,
            classes.id AS class_id,
            classes.name,
            classes.hours,
            classes.professor,
            classes.days,
            classes.location
          FROM schedules
          LEFT JOIN classes ON classes.schedule_id = schedules.id
          ORDER BY schedules.created_at DESC, classes.name ASC
        `);

        const groupedSchedules = Array.from(
          rows.reduce((grouped, row) => {
            let schedule = grouped.get(row.schedule_id);

            if (!schedule) {
              schedule = {
                id: row.schedule_id,
                semesterName: row.semester_name,
                classes: [],
              };
              grouped.set(row.schedule_id, schedule);
            }

            if (row.class_id !== null) {
              const { schedule_id, semester_name, ...classData } = row;
              schedule.classes.push(classData);
            }

            return grouped;
          }, new Map<number, Schedule>()).values()
        );

        if (active) setSchedules(groupedSchedules);
      };

      loadSchedules().catch((error) => {
        console.error('Failed to load schedules:', error);
      });

      return () => {
        active = false;
      };
    }, [db])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <HomeHeader />
        <ScheduleList schedules={schedules} />
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}
const HomeHeader = () => {
  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(500)}>
      <MyComponent />
      <Text style={styles.text}>Dashboard</Text>
    </Animated.View>
  );
};

const ScheduleList = ({ schedules }: { schedules: Schedule[] }) => {
  if (schedules.length === 0) {
    return (
      <View style={styles.scheduleBox}>
        <Text style={styles.scheduleText}>Add the “+” to add a new schedule for the semester.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scheduleScroll} contentContainerStyle={styles.scheduleList}>
      {schedules.map((schedule) => (
        <Animated.View
          key={schedule.id}
          style={styles.semesterCard}
          entering={FadeInDown.duration(350)}
        >
          <Text style={styles.semesterTitle}>{schedule.semesterName}</Text>
          {schedule.classes.map((classItem) => (
            <View key={classItem.class_id} style={styles.classRow}>
              <Text style={styles.className}>{classItem.name}</Text>
              <Text style={styles.classDetails}>{classItem.days} · {classItem.hours}</Text>
              <Text style={styles.classDetails}>{classItem.location} · {classItem.professor}</Text>
            </View>
          ))}
        </Animated.View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  container: {
    width: 'auto',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 60,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'solid',
    borderRadius: 10,
    padding: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 6 },
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    flexShrink: 1,
    color: 'black',
    fontFamily: 'InterRegular',
  },
  scheduleBox: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    paddingTop: 50
  },
  scheduleList: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  scheduleScroll: {
    flex: 1,
  },
  semesterCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  semesterTitle: {
    marginBottom: 10,
    color: '#20084f',
    fontSize: 20,
    fontWeight: '700',
  },
  classRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  className: {
    color: '#111',
    fontSize: 17,
    fontWeight: '600',
  },
  classDetails: {
    marginTop: 3,
    color: '#555',
    fontSize: 14,
  },
});
