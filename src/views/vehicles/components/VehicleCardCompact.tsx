import { memo, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { PERMISSIONS, usePermissions } from '@/permissions';
import type { VehicleItem, VehicleStatus } from '../types';

type VehicleCardCompactProps = {
  vehicle: VehicleItem;
  onPress?: (id: string) => void;
};

function VehicleCardCompactComponent({ vehicle, onPress }: VehicleCardCompactProps) {
  const { colors } = useTheme();
  const { can } = usePermissions();
  const canSeeCost = can(PERMISSIONS.VEHICLE_COST_READ);
  const statusColors = getStatusColors(vehicle.status, colors);
  const handlePress = useCallback(() => onPress?.(vehicle.id), [onPress, vehicle.id]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors['surface-container-lowest'],
          borderColor: colors.primary,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={[styles.thumbnail, { backgroundColor: colors['surface-container-high'] }]}>
        {vehicle.imageUrl ? (
          <Image
            source={{ uri: vehicle.imageUrl }}
            style={styles.image}
            contentFit="cover"
            contentPosition="center"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={vehicle.id}
            placeholder={colors['surface-container']}
          />
        ) : (
          <MaterialCommunityIcons name={vehicle.icon} size={32} color={colors.primary} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <View style={styles.nameCol}>
            <Text style={[styles.name, { color: colors['on-surface'] }]} numberOfLines={1}>
              {vehicle.name}
            </Text>
            <Text style={[styles.plate, { color: colors['on-surface-variant'] }]} numberOfLines={1}>
              {vehicle.registration}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColors.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusColors.textColor }]}>
              {vehicle.status}
            </Text>
          </View>
        </View>

        <Text style={[styles.meta, { color: colors['on-surface-variant'] }]} numberOfLines={1}>
          {vehicle.meta}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {canSeeCost ? vehicle.buyingPrice : vehicle.askingPrice}
          </Text>
          {vehicle.note && (
            <Text style={[styles.note, { color: colors['on-surface-variant'] }]}>{vehicle.note}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const VehicleCardCompact = memo(VehicleCardCompactComponent);

function getStatusColors(status: VehicleStatus, colors: ReturnType<typeof useTheme>['colors']) {
  const variants = {
    Available: {
      backgroundColor: colors['tertiary-fixed'],
      textColor: colors['on-tertiary-fixed'],
    },
    Sold: {
      backgroundColor: colors['error-container'],
      textColor: colors['on-error-container'],
    },
    'In Garage': {
      backgroundColor: colors['surface-container-high'],
      textColor: colors['on-surface-variant'],
    },
    Inspection: {
      backgroundColor: colors['secondary-container'],
      textColor: colors['on-secondary-container'],
    },
  };

  return variants[status];
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 70,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  name: {
    ...Typography.screenTitle,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  plate: {
    fontFamily: 'Courier',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  meta: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 13,
  },
  statusPill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  price: {
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  note: {
    ...Typography.caption,
    fontSize: 9,
    lineHeight: 11,
  },
});
