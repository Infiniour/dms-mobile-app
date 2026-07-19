import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { VehicleCategory, VehicleCategoryTab } from '../types';

type VehicleCategoryTabsProps = {
  tabs: VehicleCategoryTab[];
  selectedCategory: VehicleCategory;
  onSelect: (category: VehicleCategory) => void;
};

export function VehicleCategoryTabs({ tabs, selectedCategory, onSelect }: VehicleCategoryTabsProps) {
  const { colors, isDark } = useTheme();
  const selectedBackground = isDark ? colors['secondary-container'] : colors.primary;
  const selectedText = isDark ? colors['on-surface'] : colors['on-primary'];

  return (
    <View style={styles.categoryTabs}>
      {tabs.map((tab, index) => {
        const active = selectedCategory === tab.value;

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
    borderRadius: 15,
    marginTop: 18,
  },
  categoryTab: {
    flex: 1,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    ...Typography.body,
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 13,
    lineHeight: 15,
    marginTop: 3,
  },
  categoryCount: {
    ...Typography.caption,
    fontSize: 10,
    lineHeight: 12,
  },
});
