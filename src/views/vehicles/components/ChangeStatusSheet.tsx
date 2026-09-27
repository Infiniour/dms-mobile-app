import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet, Button, FloatingField } from '@/components/ui';
import { FontFamily, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { updateVehicleStatus } from '@/services';
import type { ApiVehicleStatus } from '../apiMapper';

type ChangeStatusSheetProps = {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  currentStatus: ApiVehicleStatus;
  /** Called after the API confirms the change, so the screen can refetch. */
  onUpdated: () => void;
};

type StatusOption = {
  value: Exclude<ApiVehicleStatus, 'sold'>;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

/**
 * `sold` is deliberately absent.
 *
 * A sale is more than a status: it carries a price, a date and a customer, and
 * the sale endpoint is what records those. Offering "sold" here would let
 * someone mark a vehicle sold with no sale behind it, and the dashboard's
 * revenue would never see it. Selling goes through the Sell action instead.
 */
const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'garage',
    label: 'In Garage',
    hint: 'Parked up, not being worked on or shown',
    icon: 'garage',
  },
  {
    value: 'inspection',
    label: 'Inspection',
    hint: 'Being checked over or repaired',
    icon: 'wrench-outline',
  },
  {
    value: 'ready_for_sale',
    label: 'Ready for sale',
    hint: 'Shows up on the Sales Panel',
    icon: 'tag-check-outline',
  },
];

export function ChangeStatusSheet({
  visible,
  onClose,
  vehicleId,
  currentStatus,
  onUpdated,
}: ChangeStatusSheetProps) {
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState<StatusOption['value']>(fallbackStatus(currentStatus));
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reopening the sheet starts from what the vehicle is now, not from whatever
  // the user was part-way through choosing the last time they opened it.
  useEffect(() => {
    if (visible) {
      setSelected(fallbackStatus(currentStatus));
      setNote('');
      setErrorMessage('');
    }
  }, [visible, currentStatus]);

  const isUnchanged = selected === currentStatus;

  const handleSubmit = async () => {
    setErrorMessage('');
    setIsSaving(true);

    try {
      await updateVehicleStatus(vehicleId, {
        status: selected,
        description: note.trim() || undefined,
      });

      onUpdated();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not change this vehicle’s state.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: colors['on-surface'] }]}>Change state</Text>
      <Text style={[styles.subtitle, { color: colors['on-surface-variant'] }]}>
        Where is this vehicle right now?
      </Text>

      <View style={styles.options}>
        {STATUS_OPTIONS.map((option) => {
          const active = option.value === selected;

          return (
            <Pressable
              key={option.value}
              onPress={() => setSelected(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: active
                    ? isDark
                      ? colors['surface-container-high']
                      : colors['surface-container']
                    : 'transparent',
                  borderColor: active ? colors.primary : colors['outline-variant'],
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <MaterialCommunityIcons
                name={option.icon}
                size={22}
                color={active ? colors.primary : colors['on-surface-variant']}
              />
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors['on-surface'] }]}>
                  {option.label}
                  {option.value === currentStatus ? (
                    <Text style={[styles.currentTag, { color: colors['on-surface-variant'] }]}>
                      {'  ·  current'}
                    </Text>
                  ) : null}
                </Text>
                <Text style={[styles.optionHint, { color: colors['on-surface-variant'] }]}>
                  {option.hint}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={active ? 'radiobox-marked' : 'radiobox-blank'}
                size={20}
                color={active ? colors.primary : colors['outline-variant']}
              />
            </Pressable>
          );
        })}
      </View>

      <FloatingField
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="Add a note"
      />

      <Text style={[styles.sellHint, { color: colors['on-surface-variant'] }]}>
        Marking a vehicle sold happens through the Sell action, so the sale price and customer
        are recorded with it.
      </Text>

      {errorMessage ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
      ) : null}

      <Button
        label={isUnchanged ? 'Already in this state' : 'Update state'}
        onPress={handleSubmit}
        loading={isSaving}
        disabled={isSaving || isUnchanged}
      />
    </BottomSheet>
  );
}

/** A sold vehicle has no valid option in this sheet, so the picker opens on garage. */
function fallbackStatus(status: ApiVehicleStatus): StatusOption['value'] {
  return status === 'sold' ? 'garage' : status;
}

const styles = StyleSheet.create({
  title: {
    ...Typography.title,
    includeFontPadding: false,
  },
  subtitle: {
    ...Typography.body,
    marginTop: 4,
  },
  options: {
    gap: 10,
    marginTop: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optionText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  optionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 19,
    includeFontPadding: false,
  },
  currentTag: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
  },
  optionHint: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 15,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  sellHint: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
    marginBottom: 16,
  },
  errorText: {
    ...Typography.caption,
    fontSize: 12,
    marginBottom: 12,
  },
});
