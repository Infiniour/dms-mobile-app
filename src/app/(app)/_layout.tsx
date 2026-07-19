import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

export default function AppLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 18);
  const tabBarBackground = isDark ? colors['secondary-container'] : colors.primary;
  const activeTabColor = isDark ? colors['on-surface'] : colors['on-primary'];
  const inactiveTabColor = isDark ? colors['secondary-fixed-dim'] : colors['surface-container-high'];
  const renderTabIcon =
    (name: TabIconName) =>
    ({ focused }: { focused: boolean }) => (
      <View style={styles.tabIcon}>
        <Ionicons
          name={name}
          color={focused ? activeTabColor : inactiveTabColor}
          size={24}
        />
        <View
          style={[
            styles.activeIndicator,
            {
              backgroundColor: activeTabColor,
              opacity: focused ? 1 : 0,
            },
          ]}
        />
      </View>
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: activeTabColor,
        tabBarInactiveTintColor: inactiveTabColor,
        tabBarStyle: {
          backgroundColor: tabBarBackground,
          borderTopWidth: 0,
          elevation: 0,
          height: 63 + bottomPadding,
          paddingTop: 18,
          paddingBottom: bottomPadding,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: renderTabIcon('grid'),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: renderTabIcon('car'),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: renderTabIcon('receipt'),
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: 'Tags',
          tabBarIcon: renderTabIcon('pricetag'),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: renderTabIcon('person'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    gap: 7,
    justifyContent: 'center',
    minHeight: 38,
  },
  activeIndicator: {
    width: 18,
    height: 3,
    borderRadius: 3,
  },
});
