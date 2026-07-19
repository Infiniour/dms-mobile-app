import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type FilterChipsProps<T extends string> = {
  options: readonly T[];
  selectedOption: T;
  onSelectOption: (option: T) => void;
};

export function FilterChips<T extends string>({
  options,
  selectedOption,
  onSelectOption,
}: FilterChipsProps<T>) {
  const { colors, isDark } = useTheme();
  const activeBackground = isDark ? colors['secondary-container'] : colors.primary;
  const activeText = isDark ? colors['on-surface'] : colors['on-primary'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.list}>
      {options.map((option) => {
        const active = option === selectedOption;

        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelectOption(option)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? activeBackground : 'transparent',
                borderColor: colors.primary,
              },
            ]}>
            <Text style={[styles.label, { color: active ? activeText : colors.primary }]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    width: '100%',
  },
  list: {
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 23,
    paddingBottom: 19,
  },
  chip: {
    minWidth: 42,
    height: 25,
    borderRadius: 20,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  label: {
    ...Typography.body,
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 13,
    lineHeight: 16,
  },
});
