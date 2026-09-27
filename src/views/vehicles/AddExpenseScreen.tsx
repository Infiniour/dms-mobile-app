import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, FloatingField } from '@/components/ui';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { addVehicleExpense } from '@/services';
import { FieldLabel, SelectField } from './components/VehicleFormFields';
import { expenseCategoryOptions, type ExpenseType } from './data';

const DATE_OPTION_DAYS = 60;

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Last N days, newest first — an expense is nearly always logged close to when it happened. */
function buildDateOptions() {
  const today = new Date();

  return Array.from({ length: DATE_OPTION_DAYS }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    const label =
      offset === 0 ? `Today · ${formatDateLabel(date)}` :
      offset === 1 ? `Yesterday · ${formatDateLabel(date)}` :
      formatDateLabel(date);

    return { label, value: date.toISOString().slice(0, 10) };
  });
}

function formatAmount(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 9);

  return digits ? Number(digits).toLocaleString('en-IN') : '';
}

type AddExpenseScreenProps = {
  vehicleId: string;
  vehicleName?: string;
  vehicleRegistration?: string;
};

export function AddExpenseScreen({
  vehicleId,
  vehicleName,
  vehicleRegistration,
}: AddExpenseScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const dateOptions = useMemo(buildDateOptions, []);
  const [type, setType] = useState<ExpenseType>('repair');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(dateOptions[0].value);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;

  const amountValue = Number(amount.replace(/\D/g, ''));
  const canSave = amountValue > 0 && !isSaving;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    Keyboard.dismiss();
    setErrorMessage('');
    setIsSaving(true);

    try {
      await addVehicleExpense({
        vehicleId,
        type,
        amount: amountValue,
        paidTo: paidTo.trim(),
        description: description.trim(),
        // Sent as an instant because the API stores a timestamp, not a plain date.
        date: new Date(`${date}T00:00:00`).toISOString(),
      });

      router.back();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save this expense.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={8}>
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Close"
            hitSlop={12}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="close" size={28} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={[Typography.hero2, styles.title, { color: colors['on-background'] }]}>
            Add Expense
          </Text>
          <Text style={[Typography.body, styles.subtitle, { color: colors['on-surface-variant'] }]}>
            Log a cost against this vehicle
          </Text>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Category" />
            <View style={styles.chips}>
              {expenseCategoryOptions.map((category) => {
                const selected = category.value === type;

                return (
                  <Pressable
                    key={category.value}
                    onPress={() => setType(category.value)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors['surface-container-lowest'],
                        borderColor: selected ? colors.primary : colors.outline,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={17}
                      color={selected ? colors['on-primary'] : colors.primary}
                    />
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: selected ? colors['on-primary'] : colors['on-surface'] },
                      ]}>
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Vehicle" />
            <View
              style={[
                styles.vehicleCard,
                {
                  backgroundColor: colors['surface-container-low'],
                  borderColor: colors.outline,
                },
              ]}>
              <View
                style={[styles.vehicleIcon, { backgroundColor: colors['surface-container-high'] }]}>
                <MaterialCommunityIcons name="car-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.vehicleText}>
                <Text
                  style={[styles.vehicleName, { color: colors['on-surface'] }]}
                  numberOfLines={1}>
                  {vehicleName || 'This vehicle'}
                </Text>
                {vehicleRegistration ? (
                  <Text style={[styles.vehicleMeta, { color: colors['on-surface-variant'] }]}>
                    {vehicleRegistration}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <FloatingField
              label="Amount (₹)"
              value={amount}
              onChangeText={(value) => setAmount(formatAmount(value))}
              keyboardType="number-pad"
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <FloatingField
              label="Paid to"
              value={paidTo}
              onChangeText={setPaidTo}
              placeholder="e.g. City Motors"
              editable={!isSaving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <FloatingField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Brake pad replacement"
              editable={!isSaving}
              multiline
            />
          </View>

          <View style={styles.fieldGroup}>
            <SelectField label="Date" value={date} options={dateOptions} onChange={setDate} />
          </View>

          {errorMessage ? (
            <Text style={[Typography.caption, styles.errorText, { color: colors.error }]}>
              {errorMessage}
            </Text>
          ) : null}

          <Button
            label="Save Expense"
            onPress={handleSave}
            disabled={!canSave}
            loading={isSaving}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  fieldGroup: {
    gap: 8,
    marginBottom: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  chipLabel: {
    ...Typography.screenTitle,
    fontSize: 14,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  vehicleIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  vehicleName: {
    ...Typography.screenTitle,
    fontSize: 15,
  },
  vehicleMeta: {
    ...Typography.caption,
    fontSize: 12,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  currency: {
    ...Typography.screenTitle,
    fontSize: 18,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 17,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  errorText: {
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 17,
  },
  submitButton: {
    marginTop: 12,
  },
});
