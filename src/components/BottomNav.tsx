import { Link, usePathname, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bot,
  CalendarPlus,
  LayoutDashboard,
  Settings,
  UserRound,
} from '@tamagui/lucide-icons-2';

const ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' as Href },
  { label: 'Add Class', icon: CalendarPlus, href: '/AddSchedule' as Href },
  { label: 'AI Companion', icon: Bot, href: '/AICompanion' as Href },
  { label: 'Profile', icon: UserRound, href: '/Profile' as Href },
  { label: 'Settings', icon: Settings, href: '/Settings' as Href },
];

export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ITEMS.map((item, index) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link key={item.label} href={item.href} asChild>
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.item,
                index < ITEMS.length - 1 && styles.itemDivider,
                active && styles.activeItem,
                pressed && styles.pressed,
              ]}
            >
              {active && <View style={styles.activeIndicator} />}
              <View style={[styles.iconBadge, active && styles.activeIconBadge]}>
                <Icon
                  size={24}
                  strokeWidth={active ? 2.5 : 2}
                  color={active ? '#208AEF' : '#667085'}
                />
              </View>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eaecf0',
    paddingHorizontal: 30,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 3,
  },
  itemDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#d0d5dd',
  },
  activeItem: {
    backgroundColor: '#f0f7ff',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 30,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: '#208AEF',
  },
  pressed: {
    opacity: 0.55,
  },
  iconBadge: {
    width: 40,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBadge: {
    backgroundColor: '#dceeff',
  },
});
