import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type IonIconName = React.ComponentProps<typeof Ionicons>['name'];

type ScreenTopAreaProps = {
  title: string;
  eyebrow?: string;
  greeting: string;
  subtitle: string;
  leadingIcon?: MaterialIconName;
  trailingIcon?: IonIconName;
};

export function ScreenTopArea({
  title,
  eyebrow,
  greeting,
  subtitle,
  leadingIcon = 'storefront-outline',
  trailingIcon = 'notifications-outline',
}: ScreenTopAreaProps) {
  const { colors, isDark } = useTheme();
  const actionBackground = isDark ? colors['secondary-container'] : colors.primary;
  const actionContent = isDark ? colors['on-surface'] : colors['on-primary'];

  return (
    <>
      <View style={styles.topBar}>
        <View style={[styles.brandIcon, { backgroundColor: actionBackground }]}>
          <MaterialCommunityIcons name={leadingIcon} size={21} color={actionContent} />
        </View>

        <View style={styles.brandText}>
          <Text style={[styles.brandTitle, { color: colors['on-surface'] }]}>{title}</Text>
          {eyebrow ? (
            <View style={styles.eyebrowRow}>
              <Ionicons name="location-outline" size={11} color={colors['on-surface']} />
              <Text style={[styles.eyebrowText, { color: colors['on-surface'] }]}>{eyebrow}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.notificationButton, { backgroundColor: actionBackground }]}>
          <Ionicons name={trailingIcon} size={23} color={actionContent} />
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={[Typography.hero, styles.greeting, { color: colors['on-surface'] }]}>
          {greeting}
        </Text>
        <Text style={[styles.overview, { color: colors['on-surface'] }]}>{subtitle}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    flex: 1,
    marginLeft: 15,
    gap: 4,
  },
  brandTitle: {
    ...Typography.title,
    lineHeight: 24,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyebrowText: {
    ...Typography.screenTitle,
    fontSize: 12,
    lineHeight: 14,
  },
  notificationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginTop: 28,
  },
  greeting: {
    lineHeight: 34,
  },
  overview: {
    ...Typography.body,
    marginTop: 13,
    fontSize: 15,
    lineHeight: 18,
  },
});
