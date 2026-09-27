import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { SkeletonBox } from '@/components/ui';

type VehicleSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  loading?: boolean;
};

export function VehicleSearchBar({ value, onChangeText, loading = false }: VehicleSearchBarProps) {
  const { colors, isDark } = useTheme();
  const searchBgColor = isDark ? colors['surface-container-high'] : colors['surface-container-lowest'];
  const borderColor = isDark ? 'transparent' : colors['outline-variant'];

  if (loading) {
    return (
      <View style={[styles.searchBox, { backgroundColor: searchBgColor, borderColor, borderWidth: isDark ? 0 : 1 }]}>
        <SkeletonBox width="100%" height={22} borderRadius={8} />
      </View>
    );
  }

  return (
    <View style={[styles.searchBox, { backgroundColor: searchBgColor, borderColor, borderWidth: isDark ? 0 : 1 }]}>
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
  );
}

const styles = StyleSheet.create({
  searchBox: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    alignSelf: 'stretch',
    fontSize: 14,
    includeFontPadding: false,
    minWidth: 0,
    padding: 0,
    textAlignVertical: 'center',
    fontWeight: '500',
  },
});
