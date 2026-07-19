import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type VehicleSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function VehicleSearchBar({ value, onChangeText }: VehicleSearchBarProps) {
  const { colors, isDark } = useTheme();
  const filterBackground = isDark ? colors['secondary-container'] : colors.primary;
  const filterIconColor = isDark ? colors['on-surface'] : colors['on-primary'];

  return (
    <View style={styles.searchRow}>
      <View style={[styles.searchBox, { backgroundColor: colors['surface-container-high'] }]}>
        <Ionicons name="search" size={20} color={colors['on-surface-variant']} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search name or plate..."
          placeholderTextColor={colors['on-surface-variant']}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors['on-surface'] }]}
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors['on-surface-variant']} />
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.filterButton, { backgroundColor: filterBackground }]}>
        <MaterialCommunityIcons name="tune-variant" size={26} color={filterIconColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 23,
  },
  searchBox: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    fontSize: 13,
    height: 22,
    includeFontPadding: false,
    lineHeight: 18,
    minWidth: 0,
    padding: 0,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
