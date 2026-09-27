import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography, Grid } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { BackButton } from '@/components/ui';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
};

export function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Vehicle Listed',
      message: 'Your vehicle "Swift Dzire" has been successfully listed',
      type: 'success',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      title: 'Low Inventory Alert',
      message: 'You have less than 5 vehicles in inventory',
      type: 'warning',
      timestamp: '5 hours ago',
      read: false,
    },
    {
      id: '3',
      title: 'Employee Added',
      message: 'John Doe has been added as Sales Staff',
      type: 'info',
      timestamp: '1 day ago',
      read: true,
    },
    {
      id: '4',
      title: 'Payment Received',
      message: 'Payment of ₹5,00,000 received for vehicle sale',
      type: 'success',
      timestamp: '2 days ago',
      read: true,
    },
  ]);

  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const getIconName = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'alert-circle';
      case 'error':
        return 'close-circle';
      default:
        return 'information';
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return colors['on-surface']; // Success color
      case 'warning':
        return '#FF9800'; // Warning color
      case 'error':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <BackButton />
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors['surface-container-high'] }]}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors['on-surface'] }]}>
            No Notifications
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors['on-surface-variant'] }]}>
            You're all caught up! Check back later for updates
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
          showsVerticalScrollIndicator={false}>
          {/* Title with Clear All */}
          <View style={styles.pageTitleRow}>
            <Text style={[styles.title, { color: colors['on-surface'] }]}>
              Notifications
            </Text>
            {notifications.length > 0 && (
              <Pressable onPress={handleClearAll} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
                <Text style={[styles.clearAll, { color: colors.primary }]}>Clear All</Text>
              </Pressable>
            )}
          </View>
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => handleMarkAsRead(notification.id)}
              style={({ pressed }) => [
                styles.notificationCard,
                {
                  backgroundColor: notification.read
                    ? colors['surface-container-lowest']
                    : colors['surface-container-low'],
                  borderColor: colors.outline,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${getTypeColor(notification.type)}20` },
                ]}>
                <MaterialCommunityIcons
                  name={getIconName(notification.type)}
                  size={24}
                  color={getTypeColor(notification.type)}
                />
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      {
                        color: colors['on-surface'],
                        fontWeight: notification.read ? '500' : '600',
                      },
                    ]}
                    numberOfLines={1}>
                    {notification.title}
                  </Text>
                  {!notification.read && (
                    <View
                      style={[styles.unreadDot, { backgroundColor: colors.primary }]}
                    />
                  )}
                </View>
                <Text
                  style={[styles.notificationMessage, { color: colors['on-surface-variant'] }]}
                  numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text
                  style={[styles.timestamp, { color: colors['on-surface-variant'] }]}>
                  {notification.timestamp}
                </Text>
              </View>

              <Pressable
                onPress={() => handleMarkAsRead(notification.id)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
                <Ionicons
                  name={notification.read ? 'checkmark' : 'ellipsis-horizontal'}
                  size={20}
                  color={colors['on-surface-variant']}
                />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    ...Typography.hero2,
    fontSize: 28,
    lineHeight: 34,
  },
  clearAll: {
    ...Typography.screenTitle,
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notificationTitle: {
    ...Typography.screenTitle,
    fontSize: 15,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  notificationMessage: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  timestamp: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.title,
    fontSize: 18,
    lineHeight: 22,
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
});
