import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from 'react-native-paper';
import { Link } from 'expo-router';

const MyComponent = () => <Avatar.Text size={24} label="LS" />;

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <HomeHeader />
        <AddSchedule />
        <FloatingActionButton />
      </View>
    </SafeAreaView>
  );
}

const FloatingActionButton = () => {
  return (
    <View style={styles.fabContainer}>
      <Link href="/AddSchedule" asChild>
        <Pressable
          style={({ pressed, hovered }) => [
            styles.fabButton,
            (pressed || hovered) && styles.fabButtonActive,
          ]}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
};

const HomeHeader = () => {
  return (
    <View style={styles.container}>
      <MyComponent />
      <Text style={styles.text}>Dashboard</Text>
    </View>
  );
};

const AddSchedule = () => {
  return (
    <View style={styles.scheduleBox}>
      <Text style={styles.scheduleText}>Add the “+” to add a new schedule for the semester.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#20084f',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  container: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    flexShrink: 1,
    color: 'white',
    fontFamily: 'InterRegular',
  },
  scheduleBox: {
    paddingHorizontal: 20,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    paddingTop: 50
  },
  fabContainer: {
    position: 'absolute',
    left: 30,
    bottom: 0,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
  },
  fabButtonActive: {
    backgroundColor: '#176bb8',
    transform: [{ scale: 0.96 }],
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 28,
  },
});
