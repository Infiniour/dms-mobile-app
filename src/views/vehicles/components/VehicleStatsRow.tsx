import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { VehicleStat } from '../types';

type VehicleStatsRowProps = {
  stats: VehicleStat[];
};

export function VehicleStatsRow({ stats }: VehicleStatsRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.statsRow}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.statItem}>
          <Text style={[styles.statValue, { color: getStatColor(stat.tone, colors) }]}>
            {stat.value}
          </Text>
          <Text style={[styles.statLabel, { color: colors['on-surface-variant'] }]}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getStatColor(
  tone: VehicleStat['tone'],
  colors: ReturnType<typeof useTheme>['colors']
) {
  const tones = {
    default: colors['on-surface'],
    success: colors.tertiary,
    danger: colors.error,
    primary: colors.primary,
  };

  return tones[tone];
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 58,
  },
  statValue: {
    ...Typography.title,
    fontSize: 16,
    lineHeight: 20,
  },
  statLabel: {
    ...Typography.caption,
    lineHeight: 13,
    marginTop: 2,
  },
});
