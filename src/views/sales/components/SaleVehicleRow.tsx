import { memo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { SaleVehicle } from '../types';

type SaleVehicleRowProps = {
  vehicle: SaleVehicle;
  /** Undefined when the viewer may not record sales — the row still opens the vehicle. */
  onSell?: (id: string) => void;
  onOpen: (id: string) => void;
};

function SaleVehicleRowComponent({ vehicle, onSell, onOpen }: SaleVehicleRowProps) {
  const { colors, isDark } = useTheme();
  const isSold = vehicle.status === 'Sold';
  const cardBackground = isDark
    ? colors['surface-container-low']
    : colors['surface-container-lowest'];

  return (
    <Pressable
      onPress={() => onOpen(vehicle.id)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: cardBackground,
          borderColor: colors['outline-variant'],
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: isDark ? colors['surface-container-high'] : colors['surface-container'] },
        ]}>
        <MaterialCommunityIcons name={vehicle.icon} size={22} color={colors.primary} />
      </View>

      <View style={styles.details}>
        <Text style={[styles.name, { color: colors['on-surface'] }]} numberOfLines={1}>
          {vehicle.name}
        </Text>
        <Text style={[styles.registration, { color: colors.primary }]} numberOfLines={1}>
          {vehicle.registration}
        </Text>
        <Text style={[styles.price, { color: colors['on-surface-variant'] }]} numberOfLines={1}>
          {vehicle.askingPrice}
        </Text>
      </View>

      {isSold ? (
        <View style={[styles.pill, { backgroundColor: colors['error-container'] }]}>
          <Text style={[styles.pillText, { color: colors['on-error-container'] }]}>Sold</Text>
        </View>
      ) : onSell ? (
        // Its own Pressable so the tap target is the pill, not the whole row —
        // opening the vehicle and recording a sale must not be one gesture apart.
        <Pressable
          onPress={() => onSell(vehicle.id)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.pill,
            {
              backgroundColor: isDark ? colors['secondary-container'] : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <Text
            style={[
              styles.pillText,
              { color: isDark ? colors['on-surface'] : colors['on-primary'] },
            ]}>
            Sell
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export const SaleVehicleRow = memo(SaleVehicleRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  name: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    includeFontPadding: false,
  },
  registration: {
    ...Typography.body,
    fontSize: 12,
    fontWeight: '500',
  },
  price: {
    ...Typography.caption,
    fontSize: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    minWidth: 58,
    alignItems: 'center',
  },
  pillText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    includeFontPadding: false,
  },
});
