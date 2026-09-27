import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Grid, Typography } from '@/constants/theme';
import { BottomSheet } from '@/components/ui';
import { useLogout } from '@/hooks/useLogout';
import { useTheme } from '@/hooks/useTheme';
import { PERMISSIONS, usePermissions } from '@/permissions';
import { getProfile } from '@/services';
import { syncShowroomFromProfile } from '@/utils/showroom';
import { useAuthStore, useThemeStore, type ThemePreference } from '@/store';

type ShowroomRole = {
  showroom_id: number;
  showroom_name?: string | null;
  role?: string | null;
};
type ProfileData = {
  name?: string | null;
  showroom_roles?: ShowroomRole[] | null;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  hint: string;
  icon: IconName;
}[] = [
  {
    value: 'system',
    label: 'System',
    hint: 'Match your device setting',
    icon: 'phone-portrait-outline',
  },
  {
    value: 'light',
    label: 'Light',
    hint: 'Always use light appearance',
    icon: 'sunny-outline',
  },
  {
    value: 'dark',
    label: 'Dark',
    hint: 'Always use dark appearance',
    icon: 'moon-outline',
  },
];

function themePreferenceLabel(preference: ThemePreference) {
  if (preference === 'light') {
    return 'Light mode';
  }

  if (preference === 'dark') {
    return 'Dark mode';
  }

  return 'Following system';
}

export default function AccountTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const fullName = useAuthStore((s) => s.fullName);
  const { can } = usePermissions();
  const { isLoggingOut, logout } = useLogout();
  const themePreference = useThemeStore((s) => s.themePreference);
  const setThemePreference = useThemeStore((s) => s.setThemePreference);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getProfile()
      .then((response) => {
        if (cancelled) {
          return;
        }

        const data = (response as { data?: ProfileData })?.data ?? (response as ProfileData);
        setProfile(data ?? null);

        // Keeps showroom and role in step; a role change made elsewhere lands
        // the next time this screen loads.
        syncShowroomFromProfile(data ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = profile?.name || fullName || 'Dealer';
  const primaryShowroom = getPrimaryShowroom(profile);
  const roleLine = primaryShowroom
    ? `${capitalize(primaryShowroom.role ?? 'Member')} · ${primaryShowroom.showroom_name ?? 'Showroom'}`
    : 'Dealer profile and settings';

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.avatarBlock}>
          <View style={[styles.avatarShadow, { backgroundColor: colors.primary + '15' }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors['on-primary'] }]}>
                {getInitials(displayName)}
              </Text>
            </View>
          </View>
          <Text style={[styles.name, { color: colors['on-surface'] }]}>{displayName}</Text>
          <Text style={[styles.roleLine, { color: colors['on-surface-variant'] }]}>{roleLine}</Text>
        </View>

        <View style={styles.rows}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors['on-surface-variant'] }]}>
              Management
            </Text>
            {can(PERMISSIONS.EMPLOYEE_READ) ? (
              <SettingsRow
                icon="person-add-outline"
                title="My Employees"
                subtitle="Manage sales, staff access"
                trailing="chevron"
                onPress={() => router.push('/employees')}
              />
            ) : null}
            {can(PERMISSIONS.SHOWROOM_UPDATE) ? (
              <SettingsRow
                icon="storefront-outline"
                title="My Showrooms"
                subtitle="View and manage locations"
                trailing="chevron"
                onPress={() => router.push('/showroom')}
              />
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors['on-surface-variant'] }]}>
              Account & Preferences
            </Text>
            {can(PERMISSIONS.REPORTS_READ) ? (
              <SettingsRow
                icon="ribbon-outline"
                title="Subscription"
                subtitle={'Basic plan\nRenews 15 Aug'}
                trailing="chevron"
              />
            ) : null}
            {can(PERMISSIONS.NOTIFICATION_READ) ? (
              <SettingsRow
                icon="notifications-outline"
                title="Notification"
                subtitle="Manage alerts & reminders"
                trailing="chevron"
                onPress={() => router.push('/notifications')}
              />
            ) : null}
            <SettingsRow
              icon={themePreference === 'dark' ? 'moon' : 'moon-outline'}
              title="Appearance"
              subtitle={themePreferenceLabel(themePreference)}
              trailing="chevron"
              onPress={() => setIsThemeSheetOpen(true)}
            />
          </View>

          <Pressable
            onPress={logout}
            disabled={isLoggingOut}
            style={({ pressed }) => [
              styles.logoutRow,
              {
                backgroundColor: colors['error-container'],
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomSheet visible={isThemeSheetOpen} onClose={() => setIsThemeSheetOpen(false)}>
        <Text style={[Typography.title, styles.sheetTitle, { color: colors['on-background'] }]}>
          Appearance
        </Text>
        <Text style={[Typography.body, styles.sheetSubtitle, { color: colors['on-surface-variant'] }]}>
          Choose how the app looks
        </Text>
        <View style={styles.themeOptions}>
          {THEME_OPTIONS.map((option) => {
            const selected = option.value === themePreference;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setThemePreference(option.value);
                  setIsThemeSheetOpen(false);
                }}
                style={({ pressed }) => [
                  styles.themeOption,
                  {
                    backgroundColor: selected
                      ? colors['surface-container']
                      : colors['surface-container-low'],
                    borderColor: selected ? colors.primary : colors['outline-variant'],
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <View
                  style={[styles.themeOptionIcon, { backgroundColor: colors['surface-container'] }]}>
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={selected ? colors.primary : colors['on-surface-variant']}
                  />
                </View>
                <View style={styles.themeOptionText}>
                  <Text style={[styles.themeOptionLabel, { color: colors['on-surface'] }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.themeOptionHint, { color: colors['on-surface-variant'] }]}>
                    {option.hint}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  trailing?: 'chevron' | 'edit' | React.ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          opacity: pressed ? 0.6 : 1,
          borderBottomColor: colors.outline,
        },
      ]}>
      <View style={[styles.rowIcon, { backgroundColor: colors['surface-container-high'] }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors['on-surface'] }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors['on-surface-variant'] }]}>{subtitle}</Text>
      </View>
      {trailing === 'chevron' ? (
        <Ionicons name="chevron-forward" size={18} color={colors['on-surface-variant']} />
      ) : trailing === 'edit' ? (
        <Ionicons name="pencil-outline" size={18} color={colors.primary} />
      ) : (
        trailing
      )}
    </Pressable>
  );
}

function getPrimaryShowroom(profile: ProfileData | null) {
  const roles = profile?.showroom_roles ?? [];
  return roles.find((role) => role.role === 'owner') ?? roles[0] ?? null;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Grid.columns.margin,
    paddingTop: 20,
    paddingBottom: 118,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  avatarShadow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.medium,
    fontSize: 42,
  },
  name: {
    fontFamily: FontFamily.medium,
    fontSize: 26,
    marginTop: 12,
  },
  roleLine: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  rows: {
    gap: 20,
    marginTop: 28,
  },
  section: {
    gap: 0,
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    minHeight: 56,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
  },
  rowSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  logoutRow: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  logoutText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
  },
  sheetTitle: {
    textAlign: 'center',
  },
  sheetSubtitle: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  themeOptions: {
    gap: 10,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  themeOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  themeOptionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
  },
  themeOptionHint: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
});
