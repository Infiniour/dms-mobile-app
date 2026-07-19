import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { VehicleCategory } from '../types';

type VehicleListHeaderProps = {
  selectedCategory: VehicleCategory;
  count: number;
};

export function VehicleListHeader({ selectedCategory, count }: VehicleListHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors['on-surface'] }]}>
        {selectedCategory.toUpperCase()} · {count} VEHICLES
      </Text>
      <Text style={[styles.sectionCount, { color: colors.primary }]}>See all</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    ...Typography.screenTitle,
    fontSize: 16,
    lineHeight: 20,
  },
  sectionCount: {
    ...Typography.body,
    fontFamily: Typography.screenTitle.fontFamily,
    lineHeight: 16,
  },
});
