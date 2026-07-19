import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type InventoryHeaderProps = {
  totalCount: number;
};

export function InventoryHeader({ totalCount }: InventoryHeaderProps) {
  const { colors, isDark } = useTheme();
  const actionBackground = isDark ? colors['surface-container'] : colors['surface-container-high'];

  return (
    <View style={styles.titleRow}>
      <View>
        <Text style={[styles.title, { color: colors['on-surface'] }]}>Inventory</Text>
        <Text style={[styles.subtitle, { color: colors['on-surface-variant'] }]}>
          {totalCount} vehicles in lot
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={[styles.actionButton, { backgroundColor: actionBackground }]}>
          <MaterialCommunityIcons
            name="sort-ascending"
            size={24}
            color={colors['on-surface']}
          />
        </View>
        <View style={[styles.actionButton, { backgroundColor: actionBackground }]}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors['on-surface']} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.title,
    fontSize: 21,
    lineHeight: 26,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 18,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
