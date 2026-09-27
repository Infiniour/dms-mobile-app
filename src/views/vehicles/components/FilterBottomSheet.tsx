import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { VehicleFilter } from '../types';

type FilterOption = {
  value: VehicleFilter;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  count: number;
};

type FilterBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  selectedFilter: VehicleFilter;
  onSelect: (filter: VehicleFilter) => void;
  options: FilterOption[];
};

export function FilterBottomSheet({
  visible,
  onClose,
  selectedFilter,
  onSelect,
  options,
}: FilterBottomSheetProps) {
  const { colors } = useTheme();

  const handleSelect = (filter: VehicleFilter) => {
    onSelect(filter);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.container, { paddingHorizontal: Grid.columns.margin }]}>
        <Text style={[Typography.screenTitle, { color: colors['on-background'], marginBottom: 20 }]}>
          Filter by type
        </Text>

        <View style={styles.optionsGrid}>
          {options.map((option) => {
            const isSelected = selectedFilter === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: isSelected ? colors.primary : colors['surface-container-high'],
                    borderColor: isSelected ? colors.primary : colors.outline,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <MaterialCommunityIcons
                  name={option.icon}
                  size={32}
                  color={isSelected ? colors['on-primary'] : colors.primary}
                />
                <Text
                  style={[
                    Typography.screenTitle,
                    styles.optionLabel,
                    { color: isSelected ? colors['on-primary'] : colors['on-surface'] },
                  ]}>
                  {option.label}
                </Text>
                <Text
                  style={[
                    Typography.caption,
                    { color: isSelected ? colors['on-primary'] : colors['on-surface-variant'] },
                  ]}>
                  {option.count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    flex: 1,
    minWidth: '45%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
  },
});
