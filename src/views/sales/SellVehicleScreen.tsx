import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, FloatingField, useAppAlert } from '@/components/ui';
import { FormOutlinedInput } from '@/components/forms';
import { FontFamily, Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getVehicle, sellVehicle } from '@/services';
import type { ApiVehicleDetail } from '@/views/vehicles/apiMapper';
import { PAYMENT_MODES, type InvoiceCharges, type PaymentMode } from './types';

type SellVehicleScreenProps = {
  vehicleId: string;
  /** Passed through by the sales panel so the header renders before the fetch lands. */
  vehicleName?: string;
  registration?: string;
};

/**
 * Which number goes to the API as `sale_price`.
 *
 * The server computes profit as
 *   sale_price - buying_price - expenses
 * (internal/modules/dashboard/repository.go), so `sale_price` must be the
 * vehicle's own selling price and nothing else. Folding the RTO transfer fee —
 * money that passes straight through to the RTO — into it would inflate every
 * vehicle's margin by that amount.
 *
 * 'vehicle' is therefore the correct default, not merely the safe one. The
 * 'total' option exists only if the business deliberately wants gross receipts
 * booked against the vehicle; the real fix is charge fields on the sale
 * endpoint, after which the fees stop riding along in `remarks`.
 */
const SALE_PRICE_BASIS: 'vehicle' | 'total' = 'vehicle';

export function SellVehicleScreen({
  vehicleId,
  vehicleName,
  registration,
}: SellVehicleScreenProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showAlert } = useAppAlert();

  const [name, setName] = useState(vehicleName ?? '');
  const [plate, setPlate] = useState(registration ?? '');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerState, setBuyerState] = useState('');
  const [buyerPincode, setBuyerPincode] = useState('');
  const [isBuyerDetailsOpen, setIsBuyerDetailsOpen] = useState(false);
  const [note, setNote] = useState('');
  /** The vehicle's tagged asking price. Read-only context for the negotiation. */
  const [askingPrice, setAskingPrice] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('bank_transfer');
  const [charges, setCharges] = useState<InvoiceCharges>({
    sellingPrice: '',
    rtoTransferFee: '',
    serviceCharge: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);

  // Prefills the asking price so the common case — sold at the tagged price —
  // is one tap. The form stays usable while this is in flight.
  useEffect(() => {
    let cancelled = false;

    getVehicle({ vehicleId })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const responseData = response as unknown as { data?: ApiVehicleDetail };
        const detail = responseData?.data ?? (responseData as unknown as ApiVehicleDetail);
        const basic = detail?.basic;

        if (basic) {
          setName((current) => current || `${basic.manufacturer} ${basic.model}`.trim());
          setPlate((current) => current || basic.registration_number);
        }

        const priceTag = detail?.pricing?.price_tag;

        if (typeof priceTag === 'number') {
          setAskingPrice(priceTag);
          // Seeded as the starting point, then edited down or up to whatever
          // the buyer actually agreed to.
          setCharges((current) =>
            current.sellingPrice ? current : { ...current, sellingPrice: String(priceTag) }
          );
        }
      })
      .catch(() => {
        // A failed prefill is not a failed sale — the price can still be typed
        // by hand, so this stays silent rather than blocking the form.
      });

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const totals = useMemo(() => {
    const sellingPrice = toAmount(charges.sellingPrice);
    const rtoTransferFee = toAmount(charges.rtoTransferFee);
    const serviceCharge = toAmount(charges.serviceCharge);

    return {
      sellingPrice,
      rtoTransferFee,
      serviceCharge,
      total: sellingPrice + rtoTransferFee + serviceCharge,
    };
  }, [charges]);

  /** Only meaningful once both numbers exist and actually differ. */
  const priceDelta = useMemo(() => {
    if (askingPrice === null || totals.sellingPrice <= 0 || totals.sellingPrice === askingPrice) {
      return null;
    }

    const difference = totals.sellingPrice - askingPrice;

    return {
      isDiscount: difference < 0,
      label:
        difference < 0
          ? `${formatRupees(Math.abs(difference))} below asking`
          : `${formatRupees(difference)} above asking`,
    };
  }, [askingPrice, totals.sellingPrice]);

  const invoiceText = useMemo(
    () =>
      buildInvoiceText({
        vehicle: name,
        plate,
        buyerName,
        buyerPhone,
        buyerAddress: [buyerAddress, buyerCity, buyerState, buyerPincode]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(', '),
        paymentMode,
        note,
        totals,
      }),
    [
      name,
      plate,
      buyerName,
      buyerPhone,
      buyerAddress,
      buyerCity,
      buyerState,
      buyerPincode,
      paymentMode,
      note,
      totals,
    ]
  );

  const handleGenerate = async () => {
    const validationError = validate({ buyerName, buyerPhone, buyerAddress, totals });

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage('');
    setIsSaving(true);

    try {
      const { firstName, lastName } = splitBuyerName(buyerName);

      await sellVehicle(vehicleId, {
        salePrice: SALE_PRICE_BASIS === 'total' ? totals.total : totals.sellingPrice,
        saleDate: new Date().toISOString(),
        paymentMode,
        remarks: buildRemarks(note, totals, askingPrice),
        customer: {
          firstName,
          lastName,
          phoneNumber: buyerPhone,
          email: buyerEmail,
          address: buyerAddress,
          city: buyerCity,
          state: buyerState,
          pincode: buyerPincode,
        },
      });

      setIsRecorded(true);
      showAlert({
        title: 'Invoice generated',
        message: `${name || 'Vehicle'} is now marked as sold.`,
        variant: 'success',
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not record this sale.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: invoiceText });
    } catch {
      // The user dismissing the share sheet is not an error worth surfacing.
    }
  };

  const handleWhatsApp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(invoiceText)}`;
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      showAlert({
        title: 'WhatsApp not available',
        message: 'WhatsApp does not seem to be installed on this device.',
        variant: 'error',
      });
      return;
    }

    await Linking.openURL(url);
  };

  const cardBackground = isDark
    ? colors['surface-container-low']
    : colors['surface-container-lowest'];

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: Grid.columns.margin }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.flex} keyboardVerticalOffset={8}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingHorizontal: Grid.columns.margin }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors['on-surface'] }]}>Generate Invoice</Text>
          <Text style={[styles.subtitle, { color: colors['on-surface-variant'] }]}>
            Review details before sharing with buyer
          </Text>

          <View
            style={[
              styles.vehicleCard,
              { backgroundColor: cardBackground, borderColor: colors['outline-variant'] },
            ]}>
            <View
              style={[
                styles.vehicleIcon,
                {
                  backgroundColor: isDark
                    ? colors['surface-container-high']
                    : colors['surface-container'],
                },
              ]}>
              <MaterialCommunityIcons name="car-hatchback" size={22} color={colors.primary} />
            </View>
            <View style={styles.vehicleText}>
              <Text style={[styles.vehicleName, { color: colors['on-surface'] }]} numberOfLines={1}>
                {name || 'Vehicle'}
              </Text>
              {plate ? (
                <Text style={[styles.vehiclePlate, { color: colors.primary }]}>{plate}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.fields}>
            <FormOutlinedInput
              label="Buyer name"
              value={buyerName}
              onChangeText={setBuyerName}
              placeholder="Name"
              icon="person-outline"
              autoCapitalize="words"
            />
            <FormOutlinedInput
              label="Buyer phone"
              value={buyerPhone}
              onChangeText={setBuyerPhone}
              placeholder="Phone number"
              icon="call-outline"
              keyboardType="phone-pad"
            />
            <FormOutlinedInput
              label="Buyer address"
              value={buyerAddress}
              onChangeText={setBuyerAddress}
              placeholder="Address"
              icon="home-outline"
            />
          </View>

          <Pressable
            onPress={() => setIsBuyerDetailsOpen((open) => !open)}
            style={({ pressed }) => [
              styles.disclosure,
              {
                backgroundColor: cardBackground,
                borderColor: colors['outline-variant'],
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <View style={styles.disclosureText}>
              <Text style={[styles.disclosureTitle, { color: colors['on-surface'] }]}>
                Buyer details
              </Text>
              <Text style={[styles.disclosureHint, { color: colors['on-surface-variant'] }]}>
                City, state, pincode, email
              </Text>
            </View>
            <Ionicons
              name={isBuyerDetailsOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors['on-surface-variant']}
            />
          </Pressable>

          {isBuyerDetailsOpen ? (
            <View style={styles.fields}>
              <FormOutlinedInput
                label="City"
                value={buyerCity}
                onChangeText={setBuyerCity}
                placeholder="City"
                icon="business-outline"
                autoCapitalize="words"
              />
              <FormOutlinedInput
                label="State"
                value={buyerState}
                onChangeText={setBuyerState}
                placeholder="State"
                icon="map-outline"
                autoCapitalize="words"
              />
              <FormOutlinedInput
                label="Pincode"
                value={buyerPincode}
                onChangeText={setBuyerPincode}
                placeholder="Pincode"
                icon="location-outline"
                keyboardType="numeric"
              />
              <FormOutlinedInput
                label="Email"
                value={buyerEmail}
                onChangeText={setBuyerEmail}
                placeholder="Email"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          ) : null}

          <View
            style={[
              styles.chargesCard,
              { backgroundColor: cardBackground, borderColor: colors['outline-variant'] },
            ]}>
            {askingPrice !== null ? (
              <View style={styles.chargeRow}>
                <Text style={[styles.chargeLabel, { color: colors['on-surface-variant'] }]}>
                  Asking price
                </Text>
                <Text style={[styles.askingValue, { color: colors['on-surface-variant'] }]}>
                  {formatRupees(askingPrice)}
                </Text>
              </View>
            ) : null}

            <ChargeRow
              label="Selling price"
              emphasis
              value={charges.sellingPrice}
              onChangeText={(value) => setCharges((c) => ({ ...c, sellingPrice: value }))}
            />

            {priceDelta ? (
              <Text
                style={[
                  styles.priceDelta,
                  { color: priceDelta.isDiscount ? colors.error : colors.tertiary },
                ]}>
                {priceDelta.label}
              </Text>
            ) : null}
            <ChargeRow
              label="RTO transfer fee"
              value={charges.rtoTransferFee}
              onChangeText={(value) => setCharges((c) => ({ ...c, rtoTransferFee: value }))}
            />
            <ChargeRow
              label="Service charge"
              value={charges.serviceCharge}
              onChangeText={(value) => setCharges((c) => ({ ...c, serviceCharge: value }))}
            />

            <View style={[styles.chargesDivider, { backgroundColor: colors['outline-variant'] }]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors['on-surface'] }]}>Total amount</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {formatRupees(totals.total)}
              </Text>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors['on-surface-variant'] }]}>
            Payment mode
          </Text>
          <View style={styles.chipRow}>
            {PAYMENT_MODES.map((mode) => {
              const selected = mode.value === paymentMode;

              return (
                <Pressable
                  key={mode.value}
                  onPress={() => setPaymentMode(mode.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? isDark
                          ? colors['secondary-container']
                          : colors.primary
                        : 'transparent',
                      borderColor: selected ? 'transparent' : colors['outline-variant'],
                    },
                  ]}>
                  <Ionicons
                    name={mode.icon}
                    size={16}
                    color={
                      selected
                        ? isDark
                          ? colors['on-surface']
                          : colors['on-primary']
                        : colors['on-surface-variant']
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selected
                          ? isDark
                            ? colors['on-surface']
                            : colors['on-primary']
                          : colors['on-surface-variant'],
                      },
                    ]}>
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.noteField}>
            <FormOutlinedInput
              label="Note"
              value={note}
              onChangeText={setNote}
              placeholder="Note"
              icon="document-text-outline"
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors['outline-variant'] }]} />
            <Text style={[styles.dividerText, { color: colors['on-surface-variant'] }]}>
              AFTER GENERATING
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors['outline-variant'] }]} />
          </View>

          <View style={styles.shareRow}>
            <ShareTile
              label="WhatsApp"
              icon={<MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />}
              enabled={isRecorded}
              onPress={handleWhatsApp}
            />
            <ShareTile
              label="Download"
              icon={
                <Ionicons name="download-outline" size={22} color={colors.primary} />
              }
              // No invoice document endpoint exists yet, so this stays off
              // rather than handing the user a button that quietly does nothing.
              enabled={false}
              onPress={() => {}}
            />
            <ShareTile
              label="Share"
              icon={<Ionicons name="share-social-outline" size={22} color={colors.primary} />}
              enabled={isRecorded}
              onPress={handleShare}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
            </View>
          ) : null}

          <Button
            label={isRecorded ? 'Done' : 'Generate Invoice'}
            onPress={isRecorded ? () => router.back() : handleGenerate}
            loading={isSaving}
            disabled={isSaving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChargeRow({
  label,
  value,
  onChangeText,
  emphasis = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Marks the one row that must be filled in, so it reads louder than the fees. */
  emphasis?: boolean;
}) {
  return (
    <FloatingField
      label={emphasis ? `${label} *` : label}
      value={formatAmountInput(value)}
      onChangeText={(next) => onChangeText(next.replace(/\D/g, ''))}
      keyboardType="numeric"
      selectTextOnFocus
      placeholder="0"
    />
  );
}

function ShareTile({
  label,
  icon,
  enabled,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      style={({ pressed }) => [
        styles.shareTile,
        {
          backgroundColor: isDark ? colors['surface-container-high'] : colors['surface-container'],
          opacity: !enabled ? 0.45 : pressed ? 0.85 : 1,
        },
      ]}>
      {icon}
      <Text style={[styles.shareLabel, { color: colors['on-surface-variant'] }]}>{label}</Text>
    </Pressable>
  );
}

function toAmount(value: string) {
  const amount = Number(value.replace(/\D/g, ''));

  return Number.isFinite(amount) ? amount : 0;
}

function formatAmountInput(value: string) {
  return value ? Number(value).toLocaleString('en-IN') : '';
}

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * The API takes first and last name separately; the invoice asks for one buyer
 * name. Everything before the final word is the first name, so "Anjali Kumari
 * Sharma" keeps "Kumari" rather than dropping it.
 */
function splitBuyerName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { firstName: parts[0] ?? '', lastName: '' };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

/**
 * `remarks` carries two things because the API gives us one free-text field and
 * two things to say: whatever the user typed, and the charge breakdown the sale
 * endpoint has no fields for. The note comes first so a human reading the sale
 * record sees the human part first. Drop the second half once the backend
 * accepts real charge fields.
 */
function buildRemarks(
  note: string,
  totals: {
    sellingPrice: number;
    rtoTransferFee: number;
    serviceCharge: number;
    total: number;
  },
  askingPrice: number | null
) {
  return [note.trim(), buildChargesRemark(totals, askingPrice)].filter(Boolean).join('\n');
}

/** Carries the charges the sale API has no fields for into the one free-text field it does. */
function buildChargesRemark(
  totals: {
    sellingPrice: number;
    rtoTransferFee: number;
    serviceCharge: number;
    total: number;
  },
  askingPrice: number | null
) {
  const lines = [];

  // Worth keeping: `sale_price` records what the vehicle went for, but not what
  // it was tagged at, and the gap between them is the negotiation.
  if (askingPrice !== null && askingPrice !== totals.sellingPrice) {
    lines.push(`Asking ${formatRupees(askingPrice)}`);
  }

  lines.push(`Sold ${formatRupees(totals.sellingPrice)}`);

  if (totals.rtoTransferFee > 0) {
    lines.push(`RTO transfer fee ${formatRupees(totals.rtoTransferFee)}`);
  }

  if (totals.serviceCharge > 0) {
    lines.push(`Service charge ${formatRupees(totals.serviceCharge)}`);
  }

  lines.push(`Total ${formatRupees(totals.total)}`);

  return lines.join(' · ');
}

function buildInvoiceText({
  vehicle,
  plate,
  buyerName,
  buyerPhone,
  buyerAddress,
  paymentMode,
  note,
  totals,
}: {
  vehicle: string;
  plate: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  paymentMode: PaymentMode;
  note: string;
  totals: { sellingPrice: number; rtoTransferFee: number; serviceCharge: number; total: number };
}) {
  const modeLabel = PAYMENT_MODES.find((mode) => mode.value === paymentMode)?.label ?? paymentMode;

  // Optional lines are filtered out rather than sent blank, so an invoice with
  // only the required fields still reads as a finished document.
  return [
    'INVOICE',
    '',
    `Vehicle: ${vehicle}${plate ? ` (${plate})` : ''}`,
    `Buyer: ${buyerName}`,
    buyerPhone.trim() ? `Phone: ${buyerPhone.trim()}` : null,
    buyerAddress ? `Address: ${buyerAddress}` : null,
    '',
    `Selling price: ${formatRupees(totals.sellingPrice)}`,
    `RTO transfer fee: ${formatRupees(totals.rtoTransferFee)}`,
    `Service charge: ${formatRupees(totals.serviceCharge)}`,
    `Total amount: ${formatRupees(totals.total)}`,
    '',
    `Payment mode: ${modeLabel}`,
    note.trim() ? `\nNote: ${note.trim()}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Mirrors the server's required set exactly (first_name, last_name,
 * phone_number, address, sale_price > 0) so a missing field is named here
 * rather than coming back as an unexplained "invalid request".
 */
function validate({
  buyerName,
  buyerPhone,
  buyerAddress,
  totals,
}: {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  totals: { sellingPrice: number };
}) {
  const nameParts = buyerName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length < 2) {
    return "Enter the buyer's full name, first and last.";
  }

  if (buyerPhone.replace(/\D/g, '').length < 10) {
    return "Enter the buyer's phone number.";
  }

  if (!buyerAddress.trim()) {
    return "Enter the buyer's address.";
  }

  if (totals.sellingPrice <= 0) {
    return 'Enter the selling price.';
  }

  return '';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    ...Typography.hero,
    fontSize: 26,
    includeFontPadding: false,
  },
  subtitle: {
    ...Typography.body,
    marginTop: 6,
    lineHeight: 19,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 22,
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  vehicleName: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    includeFontPadding: false,
  },
  vehiclePlate: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '500',
  },
  fields: {
    gap: 18,
    marginTop: 22,
  },
  fieldLabel: {
    ...Typography.body,
    fontSize: 13,
    marginTop: 22,
    marginBottom: 12,
  },
  chargesCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 22,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 7,
  },
  chargeLabel: {
    ...Typography.body,
    fontSize: 13,
    flexShrink: 1,
  },
  chargeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chargeLabelEmphasis: {
    fontFamily: FontFamily.medium,
  },
  chargeCurrency: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    includeFontPadding: false,
  },
  chargeInput: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    includeFontPadding: false,
    padding: 0,
    minWidth: 72,
    textAlign: 'right',
  },
  askingValue: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    includeFontPadding: false,
  },
  priceDelta: {
    ...Typography.caption,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  chargesDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    includeFontPadding: false,
  },
  totalValue: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    includeFontPadding: false,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 17,
    includeFontPadding: false,
  },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 18,
  },
  disclosureText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  disclosureTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 19,
    includeFontPadding: false,
  },
  disclosureHint: {
    ...Typography.caption,
    fontSize: 11,
  },
  noteField: {
    marginTop: 22,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    ...Typography.micro,
    letterSpacing: 0.6,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  shareTile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareLabel: {
    ...Typography.caption,
    fontSize: 11,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  errorText: {
    ...Typography.caption,
    fontSize: 12,
    flex: 1,
  },
});
