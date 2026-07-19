import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { VehicleStatus, VehicleStatusFilter } from '../types';

type VehicleStatusChipsProps = {
  filters: VehicleStatusFilter[];
  selectedFilter: VehicleStatusFilter;
  counts: Record<VehicleStatus, number>;
  onSelect: (filter: VehicleStatusFilter) => void;
};

export function VehicleStatusChips({
  filters,
  selectedFilter,
  counts,
  onSelect,
}: VehicleStatusChipsProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.statusChips}>
      {filters.map((filter) => {
        const active = filter === selectedFilter;
        const chipColors = getFilterChipColors(filter, active, colors, isDark);

        return (
          <Pressable
            key={filter}
            onPress={() => onSelect(filter)}
            style={[styles.statusChip, { backgroundColor: chipColors.backgroundColor }]}>
            <Text style={[styles.statusText, { color: chipColors.textColor }]}>
              {getFilterLabel(filter, counts)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getFilterLabel(filter: VehicleStatusFilter, counts: Record<VehicleStatus, number>) {
  const labels = {
    All: 'All',
    Available: `Available ${counts.Available}`,
    Sold: `Sold ${counts.Sold}`,
    'In Repair': `Repair ${counts['In Repair']}`,
  };

  return labels[filter];
}

function getFilterChipColors(
  filter: VehicleStatusFilter,
  active: boolean,
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) {
  if (active) {
    return {
      backgroundColor: isDark ? colors['secondary-container'] : colors.primary,
      textColor: isDark ? colors['on-surface'] : colors['on-primary'],
    };
  }

  const variants = {
    All: {
      backgroundColor: colors['primary-fixed'],
      textColor: colors['on-primary-fixed'],
    },
    Available: {
      backgroundColor: colors['tertiary-fixed'],
      textColor: colors['on-tertiary-fixed'],
    },
    Sold: {
      backgroundColor: colors['error-container'],
      textColor: colors['on-error-container'],
    },
    'In Repair': {
      backgroundColor: colors['surface-container-high'],
      textColor: colors['on-surface-variant'],
    },
  };

  return variants[filter];
}

const styles = StyleSheet.create({
  statusChips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 20,
  },
  statusChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  statusText: {
    ...Typography.body,
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
});
