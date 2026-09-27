import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { SkeletonBox } from '@/components/ui';
import type { VehicleCategory, VehicleCategoryTab, VehicleFilter } from '../types';

type CategoryTab = {
  value: VehicleFilter;
  label: string;
  count: number;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

type VehicleCategoryTabsProps = {
  tabs: readonly CategoryTab[];
  selectedCategory?: VehicleCategory | null;
  onSelect: (category: VehicleFilter) => void;
  loading?: boolean;
};

export function VehicleCategoryTabs({ tabs, selectedCategory, onSelect, loading = false }: VehicleCategoryTabsProps) {
  const { colors, isDark } = useTheme();
  const selectedBackground = isDark ? colors['secondary-container'] : colors.primary;
  const selectedText = isDark ? colors['on-surface'] : colors['on-primary'];

  if (loading) {
    return (
      <View style={styles.categoryTabs}>
        {Array(4).fill(null).map((_, index) => (
          <View
            key={`skeleton-${index}`}
            style={[
              styles.categoryTab,
              {
                backgroundColor: colors['surface-container-high'],
                borderRightColor: colors.background,
                borderRightWidth: index === 3 ? 0 : 3,
              },
            ]}>
            <SkeletonBox width={15} height={15} borderRadius={3} style={{ marginBottom: 4 }} />
            <SkeletonBox width={40} height={12} borderRadius={4} style={{ marginBottom: 2 }} />
            <SkeletonBox width={24} height={10} borderRadius={3} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.categoryTabs}>
      {tabs.map((tab, index) => {
        const active =
          tab.value === 'All' ? !selectedCategory : selectedCategory === tab.value;

        return (
          <Pressable
            key={tab.value}
            onPress={() => onSelect(tab.value)}
            style={[
              styles.categoryTab,
              {
                backgroundColor: active ? selectedBackground : colors['surface-container-high'],
                borderRightColor: colors.background,
                borderRightWidth: index === tabs.length - 1 ? 0 : 3,
              },
            ]}>
            <MaterialCommunityIcons
              name={tab.icon}
              size={15}
              color={active ? selectedText : colors['on-surface']}
            />
            <Text
              style={[
                styles.categoryLabel,
                { color: active ? selectedText : colors['on-surface'] },
              ]}>
              {tab.label}
            </Text>
            <Text
              style={[
                styles.categoryCount,
                { color: active ? selectedText : colors['on-surface-variant'] },
              ]}>
              {tab.count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryTabs: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryTab: {
    flex: 1,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  categoryLabel: {
    ...Typography.body,
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
  },
  categoryCount: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500',
  },
});
