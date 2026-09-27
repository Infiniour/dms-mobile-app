import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, Button, FloatingField } from '@/components/ui';
import { FontFamily, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { updateVehiclePricing } from '@/services';

type EditPricingSheetProps = {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  buyingPriceAmount?: number;
  askingPriceAmount?: number;
  buyingDate?: string;
  onUpdated: () => void;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

/**
 * Inline buying/asking edit from the detail screen — uses the pricing PATCH
 * so the user does not have to open the full vehicle edit form.
 */
export function EditPricingSheet({
  visible,
  onClose,
  vehicleId,
  buyingPriceAmount,
  askingPriceAmount,
  buyingDate,
  onUpdated,
}: EditPricingSheetProps) {
  const { colors } = useTheme();
  const [buyingPrice, setBuyingPrice] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }

    setBuyingPrice(
      typeof buyingPriceAmount === 'number' && Number.isFinite(buyingPriceAmount)
        ? String(buyingPriceAmount)
        : ''
    );
    setAskingPrice(
      typeof askingPriceAmount === 'number' && Number.isFinite(askingPriceAmount)
        ? String(askingPriceAmount)
        : ''
    );
    setErrorMessage('');
  }, [visible, buyingPriceAmount, askingPriceAmount]);

  const canSave =
    buyingPrice.trim().length > 0 &&
    askingPrice.trim().length > 0 &&
    Number(buyingPrice) > 0 &&
    Number(askingPrice) > 0 &&
    !isSaving;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const resolvedBuyingDate = (buyingDate || new Date().toISOString()).slice(0, 10);

      await updateVehiclePricing({
        vehicleId,
        buyingPrice: Number(buyingPrice),
        buyingDate: resolvedBuyingDate,
        priceTag: Number(askingPrice),
        taggedAt: new Date().toISOString(),
        currency: 'inr',
        remarks: undefined,
      });
      onUpdated();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update pricing.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[Typography.title, styles.title, { color: colors['on-background'] }]}>
        Edit prices
      </Text>
      <Text style={[Typography.body, styles.subtitle, { color: colors['on-surface-variant'] }]}>
        Update buying and asking price without leaving this screen.
      </Text>

      <View style={styles.fields}>
        <FloatingField
          label="Buying price (₹)"
          value={buyingPrice}
          onChangeText={(value) => setBuyingPrice(digitsOnly(value))}
          keyboardType="number-pad"
        />
        <FloatingField
          label="Asking price (₹)"
          value={askingPrice}
          onChangeText={(value) => setAskingPrice(digitsOnly(value))}
          keyboardType="number-pad"
        />
      </View>

      {errorMessage ? (
        <Text style={[Typography.caption, styles.error, { color: colors.error }]}>{errorMessage}</Text>
      ) : null}

      <Button label="Save prices" onPress={handleSave} disabled={!canSave} loading={isSaving} />
      <Pressable onPress={onClose} style={styles.cancel} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[Typography.body, { color: colors['on-surface-variant'] }]}>Cancel</Text>
        )}
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  fields: {
    gap: 4,
    marginBottom: 16,
  },
  error: {
    marginBottom: 12,
    textAlign: 'center',
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 14,
  },
});
