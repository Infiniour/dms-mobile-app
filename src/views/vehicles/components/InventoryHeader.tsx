import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ViewMode = 'card' | 'compact';

type InventoryHeaderProps = {
  totalCount: number;
  onAddPress?: () => void;
  /** Hidden rather than disabled: an action you can never take should not be there. */
  canAdd?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
};

export function InventoryHeader({
  totalCount,
  onAddPress,
  canAdd = true,
  viewMode = 'card',
  onViewModeChange,
}: InventoryHeaderProps) {
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
        <Pressable
          onPress={() => onViewModeChange?.(viewMode === 'card' ? 'compact' : 'card')}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <MaterialCommunityIcons
            name={viewMode === 'card' ? 'view-module' : 'format-list-bulleted'}
            size={24}
            color={colors['on-secondary']}
          />
        </Pressable>
        {canAdd ? (
          <Pressable
            onPress={onAddPress}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: actionBackground, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Ionicons name="add" size={28} color={colors.primary} />
          </Pressable>
        ) : null}
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
    gap: 12,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 8,
    right: 8,
  },
});
