import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Avatar } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomNav } from '@/components/BottomNav';
import { MoreVertical, Pencil, Trash2, CalendarPlus } from '@tamagui/lucide-icons-2';
import { useAppTheme } from '@/context/AppTheme';

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
  const router = useRouter();
  const { colors } = useAppTheme();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const editSchedule = (schedule: Schedule) => {
    setOpenMenuId(null);
    router.push({ pathname: '/AddSchedule', params: { scheduleId: String(schedule.id) } });
  };

  const deleteSchedule = (schedule: Schedule) => {
    setOpenMenuId(null);
    Alert.alert(
      'Delete semester?',
      `This will delete ${schedule.semesterName} and all of its classes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await db.runAsync('DELETE FROM schedules WHERE id = ?', schedule.id);
            setSchedules((current) =>
              current.filter((item) => item.id !== schedule.id)
            );
          },
        },
      ]
    );
  };

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <HomeHeader />
        <ScheduleList
          schedules={schedules}
          openMenuId={openMenuId}
          onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)}
          onEdit={editSchedule}
          onDelete={deleteSchedule}
        />
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}
const HomeHeader = () => {
  const { colors } = useAppTheme();
  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]} entering={FadeIn.duration(500)}>
      <MyComponent />
      <Text style={[styles.text, { color: colors.text }]}>Dashboard</Text>
    </Animated.View>
  );
};

interface ScheduleListProps {
  schedules: Schedule[];
  openMenuId: number | null;
  onToggleMenu: (id: number) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
}

const ScheduleList = ({
  schedules,
  openMenuId,
  onToggleMenu,
  onEdit,
  onDelete,
}: ScheduleListProps) => {
  const { colors } = useAppTheme();
  if (schedules.length === 0) {
    return (
      <Animated.View
        style={styles.scheduleBox}
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(300)}
      >
        <View style={styles.scheduleMessageRow}>
          <Text style={[styles.scheduleText, { color: colors.textSecondary }]}>Select</Text>
          <View style={[styles.scheduleIcon, { backgroundColor: colors.activeSurface }]}>
            <CalendarPlus size={20} color={colors.primary} />
          </View>
          <Text style={[styles.scheduleText, { color: colors.textSecondary }]}>to add a new semester schedule.</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <ScrollView style={styles.scheduleScroll} contentContainerStyle={styles.scheduleList}>
      {schedules.map((schedule) => (
        <Animated.View
          key={schedule.id}
          style={[styles.semesterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInDown.duration(350)}
        >
          <View style={styles.semesterHeader}>
            <Text style={[styles.semesterTitle, { color: colors.primary }]}>{schedule.semesterName}</Text>
            <Pressable
              style={styles.menuButton}
              onPress={() => onToggleMenu(schedule.id)}
              accessibilityLabel={`Actions for ${schedule.semesterName}`}
            >
              <MoreVertical size={22} color={colors.textSecondary} />
            </Pressable>
            {openMenuId === schedule.id && (
              <View style={[styles.actionMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Pressable style={styles.menuAction} onPress={() => onEdit(schedule)}>
                  <Pencil size={17} color={colors.textSecondary} />
                  <Text style={[styles.menuActionText, { color: colors.text }]}>Edit semester and classes</Text>
                </Pressable>
                <Pressable style={styles.menuAction} onPress={() => onDelete(schedule)}>
                  <Trash2 size={17} color={colors.danger} />
                  <Text style={[styles.deleteActionText, { color: colors.danger }]}>Delete semester</Text>
                </Pressable>
              </View>
            )}
          </View>
          {schedule.classes.map((classItem) => (
            <View key={classItem.class_id} style={[styles.classRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.className, { color: colors.text }]}>{classItem.name}</Text>
              <Text style={[styles.classDetails, { color: colors.textSecondary }]}>{classItem.days} · {classItem.hours}</Text>
              <Text style={[styles.classDetails, { color: colors.textSecondary }]}>{classItem.location} · {classItem.professor}</Text>
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
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleMessageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scheduleIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#eaf4ff',
  },
  scheduleText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475467',
    textAlign: 'center',
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
    flex: 1,
    color: '#20084f',
    fontSize: 20,
    fontWeight: '700',
  },
  semesterHeader: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  actionMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    zIndex: 10,
    minWidth: 180,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  menuAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  menuActionText: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteActionText: {
    color: '#d92d20',
    fontSize: 14,
    fontWeight: '500',
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
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  modalTitle: {
    marginBottom: 16,
    color: '#101828',
    fontSize: 20,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#101828',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#d0d5dd',
  },
  cancelButtonText: {
    color: '#344054',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#208AEF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
