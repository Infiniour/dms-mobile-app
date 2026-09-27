import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { VehicleCategory } from '../types';

type VehicleListHeaderProps = {
  selectedCategory?: VehicleCategory | null;
  count: number;
};

export function VehicleListHeader({ selectedCategory, count }: VehicleListHeaderProps) {
  const { colors } = useTheme();
  const displayCategory = selectedCategory ? selectedCategory.toUpperCase() : 'ALL';

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors['on-surface'] }]}>
        {displayCategory} · {count} VEHICLES
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    ...Typography.screenTitle,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
  },
});
