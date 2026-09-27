import { memo, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { PERMISSIONS, usePermissions } from '@/permissions';
import type { VehicleItem, VehicleStatus } from '../types';

type VehicleCardProps = {
  vehicle: VehicleItem;
  onPress?: (id: string) => void;
};

// Memoized: the inventory list re-renders on every keystroke in the search bar
// and on every filter change, and each card is a fairly deep subtree.
function VehicleCardComponent({ vehicle, onPress }: VehicleCardProps) {
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
          borderWidth: 1.5,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={[styles.accentBar, { backgroundColor: statusColors.backgroundColor }]} />
      <View style={[styles.imageWrapper, { backgroundColor: colors['surface-container-high'] }]}>
        {vehicle.imageUrl ? (
          <Image
            source={{ uri: vehicle.imageUrl }}
            style={styles.image}
            contentFit="cover"
            contentPosition="center"
            transition={250}
            cachePolicy="memory-disk"
            recyclingKey={vehicle.id}
            placeholder={colors['surface-container']}
            placeholderContentFit="cover"
          />
        ) : (
          <MaterialCommunityIcons name={vehicle.icon} size={52} color={colors.primary} />
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.titleWrapper}>
            <Text style={[styles.vehicleName, { color: colors['on-surface'] }]} numberOfLines={1}>
              {vehicle.name}
            </Text>
            <Text style={[styles.plate, { color: colors['on-surface-variant'] }]} numberOfLines={1}>
              {vehicle.registration}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.backgroundColor }]}>
            <Text style={[styles.statusLabel, { color: statusColors.textColor }]}>
              {vehicle.status}
            </Text>
          </View>
        </View>

        <Text style={[styles.specs, { color: colors['on-surface-variant'] }]} numberOfLines={1}>
          {vehicle.meta}
        </Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.priceCaption, { color: colors['on-surface-variant'] }]}>
              {canSeeCost ? 'Buying' : 'Asking'}
            </Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              {canSeeCost ? vehicle.buyingPrice : vehicle.askingPrice}
            </Text>
          </View>
          {vehicle.note && (
            <Text style={[styles.timeIndicator, { color: colors['on-surface-variant'] }]}>
              {vehicle.note}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const VehicleCard = memo(VehicleCardComponent);

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
    borderRadius: 20,
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  accentBar: {
    width: '100%',
    height: 4,
  },
  imageWrapper: {
    width: '100%',
    height: 136,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  vehicleName: {
    ...Typography.screenTitle,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  plate: {
    fontFamily: 'Courier',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  specs: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  priceCaption: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginTop: 3,
  },
  statusBadge: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 70,
    alignItems: 'center',
  },
  statusLabel: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  timeIndicator: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    textAlign: 'right',
  },
});
