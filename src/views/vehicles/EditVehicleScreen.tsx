import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BackButton, Button } from '@/components/ui';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  ApiError,
  deleteVehicleImage,
  getVehicle,
  updateVehicle,
  updateVehiclePricing,
  uploadVehicleImage,
} from '@/services';
import { collectImagesWithLabels, type ApiVehicleDetail } from './apiMapper';
import {
  fuelTypeOptions,
  indianStateOptions,
  transmissionTypeOptions,
  vehicleTypeOptions,
  yearOfManufactureOptions,
} from './data';
import {
  FieldLabel,
  FormTextInput,
  SelectField,
  formFieldStyles,
} from './components/VehicleFormFields';
import {
  VehiclePhotosPicker,
  type ExistingVehiclePhoto,
  type VehiclePhoto,
} from './components/VehiclePhotosPicker';

type EditVehicleScreenProps = {
  vehicleId: string;
};

type VehicleForm = {
  vehicleType: string;
  fuelType: string;
  manufacturer: string;
  model: string;
  variant: string;
  color: string;
  yearOfManufacture: string;
  usageKm: string;
  rtoCode: string;
  registrationState: string;
  registrationNumber: string;
  transmissionType: string;
  buyingPrice: string;
  askingPrice: string;
};

function formFromDetail(detail: ApiVehicleDetail): VehicleForm {
  const basic = detail.basic;

  return {
    vehicleType: basic.vehicle_type ?? '',
    fuelType: basic.fuel_type ?? '',
    manufacturer: basic.manufacturer ?? '',
    model: basic.model ?? '',
    variant: basic.variant ?? '',
    color: basic.color ?? '',
    yearOfManufacture: basic.year_of_manufacture ? String(basic.year_of_manufacture) : '',
    usageKm: basic.usage_km !== undefined ? String(basic.usage_km) : '',
    rtoCode: basic.rto_code ?? '',
    registrationState: basic.registration_state ?? '',
    registrationNumber: basic.registration_number ?? '',
    transmissionType: basic.transmission_type ?? '',
    buyingPrice:
      detail.buying_details?.buying_price !== undefined &&
      detail.buying_details?.buying_price !== null
        ? String(detail.buying_details.buying_price)
        : '',
    askingPrice:
      detail.pricing?.price_tag !== undefined && detail.pricing?.price_tag !== null
        ? String(detail.pricing.price_tag)
        : '',
  };
}

function isFormComplete(form: VehicleForm) {
  return (
    form.vehicleType.trim().length > 0 &&
    form.fuelType.trim().length > 0 &&
    form.manufacturer.trim().length > 0 &&
    form.model.trim().length > 0 &&
    form.variant.trim().length > 0 &&
    form.color.trim().length > 0 &&
    Number(form.yearOfManufacture) > 1900 &&
    form.usageKm.trim().length > 0 &&
    form.rtoCode.trim().length > 1 &&
    form.registrationState.trim().length > 0 &&
    form.transmissionType.trim().length > 0 &&
    form.buyingPrice.trim().length > 0 &&
    form.askingPrice.trim().length > 0
  );
}

export function EditVehicleScreen({ vehicleId }: EditVehicleScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [form, setForm] = useState<VehicleForm | null>(null);
  const [buyingDate, setBuyingDate] = useState<string | undefined>();
  const [taggedAt, setTaggedAt] = useState<string | undefined>();
  const [currency, setCurrency] = useState('inr');
  const [existingPhotos, setExistingPhotos] = useState<ExistingVehiclePhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<VehiclePhoto[]>([]);
  const [removingPhotoId, setRemovingPhotoId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSold, setIsSold] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setLoadError('');

    getVehicle({ vehicleId })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const responseData = response as unknown as { data?: ApiVehicleDetail };
        const detail = responseData?.data ?? (responseData as unknown as ApiVehicleDetail);

        setForm(formFromDetail(detail));
        setIsSold(detail.basic?.current_status?.status === 'sold');
        setBuyingDate(detail.buying_details?.buying_date ?? undefined);
        setTaggedAt(detail.pricing?.tagged_at ?? undefined);
        setCurrency(detail.pricing?.currency ?? 'inr');
        setExistingPhotos(collectImagesWithLabels(detail.images));
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        const notFound = error instanceof ApiError && error.status === 404;
        setLoadError(
          notFound
            ? 'This vehicle may have been removed from inventory.'
            : error instanceof Error
              ? error.message
              : 'Unable to load this vehicle.'
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const updateField = (field: keyof VehicleForm, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const removeExistingPhoto = async (photo: ExistingVehiclePhoto) => {
    setRemovingPhotoId(photo.id);
    setErrorMessage('');

    try {
      await deleteVehicleImage({ vehicleId, imageId: photo.id });
      setExistingPhotos((current) => current.filter((item) => item.id !== photo.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to remove photo.');
    } finally {
      setRemovingPhotoId(null);
    }
  };

  const handleSubmit = async () => {
    // Core update + pricing + photo APIs all return 422 once sold.
    if (!form || isSold || !isFormComplete(form) || isSubmitting) {
      return;
    }

    const buyingPriceValue = Number(form.buyingPrice);
    const priceTagValue = Number(form.askingPrice);

    // Validate pricing (must be > 0)
    if (buyingPriceValue <= 0) {
      setErrorMessage('Buying price must be greater than 0');
      return;
    }
    if (priceTagValue <= 0) {
      setErrorMessage('Asking price must be greater than 0');
      return;
    }

    Keyboard.dismiss();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const requests = [
        updateVehicle({
          vehicleId,
          vehicleType: form.vehicleType,
          manufacturer: form.manufacturer,
          model: form.model,
          variant: form.variant,
          color: form.color,
          yearOfManufacture: form.yearOfManufacture,
          rtoCode: form.rtoCode,
          registrationState: form.registrationState,
          usageKm: form.usageKm,
          fuelType: form.fuelType,
          transmissionType: form.transmissionType,
        }),
      ];

      // Pricing is required, so always send it
      const resolvedBuyingDate = buyingDate
        ? buyingDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      requests.push(
        updateVehiclePricing({
          vehicleId,
          buyingPrice: buyingPriceValue,
          buyingDate: resolvedBuyingDate,
          priceTag: priceTagValue,
          taggedAt: taggedAt ?? new Date().toISOString(),
          currency,
          remarks: undefined,
        })
      );

      await Promise.all(requests);

      if (newPhotos.length > 0) {
        const uploadResults = await Promise.allSettled(
          newPhotos.map((photo) =>
            uploadVehicleImage({ vehicleId: Number(vehicleId), label: photo.label, photo })
          )
        );

        if (__DEV__) {
          console.log('Vehicle photo upload results', uploadResults);
        }
      }

      router.back();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { paddingHorizontal: Grid.columns.margin }]}>
          <BackButton />
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!form || loadError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { paddingHorizontal: Grid.columns.margin }]}>
          <BackButton />
        </View>
        <View style={[styles.missingContent, { paddingHorizontal: Grid.columns.margin }]}>
          <Text style={[Typography.title, { color: colors['on-surface'] }]}>Vehicle not found</Text>
          <Text style={[Typography.body, { color: colors['on-surface-variant'], marginTop: 8 }]}>
            {loadError || 'This vehicle may have been removed from inventory.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={8}>
        <View style={[styles.header, { paddingHorizontal: Grid.columns.margin }]}>
          <BackButton />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingHorizontal: Grid.columns.margin }]}
          showsVerticalScrollIndicator={false}>
          <Text style={[Typography.hero2, styles.title, { color: colors['on-background'] }]}>
            Edit{'\n'}vehicle
          </Text>
          <Text style={[Typography.body, styles.subtitle, { color: colors['on-surface'] }]}>
            {isSold
              ? 'This vehicle is sold. Details can be viewed but no longer changed.'
              : 'Update inventory details, pricing, and photos.'}
          </Text>

          {isSold ? (
            <View style={[styles.soldNotice, { backgroundColor: colors['error-container'] }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors['on-error-container']} />
              <Text style={[styles.soldText, { color: colors['on-error-container'] }]}>
                Sold vehicles are locked. Core fields, pricing, and photos can’t be edited.
              </Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <FieldLabel label="Photos" />
            <VehiclePhotosPicker
              photos={newPhotos}
              onChange={setNewPhotos}
              existingPhotos={existingPhotos}
              onRemoveExisting={isSold ? undefined : removeExistingPhoto}
              removingExistingId={removingPhotoId}
              locked={isSold}
            />
          </View>

          <View style={formFieldStyles.formFields}>
            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <FormTextInput
                  label="Buying price"
                  value={form.buyingPrice}
                  onChangeText={(value) =>
                    updateField('buyingPrice', value.replace(/\D/g, ''))
                  }
                  keyboardType="number-pad"
                  editable={!isSold}
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <FormTextInput
                  label="Asking price"
                  value={form.askingPrice}
                  onChangeText={(value) =>
                    updateField('askingPrice', value.replace(/\D/g, ''))
                  }
                  keyboardType="number-pad"
                  editable={!isSold}
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <SelectField
                  label="Vehicle type"
                  value={form.vehicleType}
                  options={vehicleTypeOptions}
                  onChange={(value) => updateField('vehicleType', value)}
                  disabled={isSold}
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <SelectField
                  label="Fuel type"
                  value={form.fuelType}
                  options={fuelTypeOptions}
                  onChange={(value) => updateField('fuelType', value)}
                  disabled={isSold}
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <FormTextInput
                  label="Manufacturer"
                  value={form.manufacturer}
                  onChangeText={(value) => updateField('manufacturer', value)}
                  placeholder="Suzuki"
                  editable={!isSold}
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <FormTextInput
                  label="Model"
                  value={form.model}
                  onChangeText={(value) => updateField('model', value)}
                  placeholder="Swift Dzire VXI"
                  editable={!isSold}
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <FormTextInput
                  label="Variant"
                  value={form.variant}
                  onChangeText={(value) => updateField('variant', value)}
                  placeholder="LE"
                  editable={!isSold}
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <FormTextInput
                  label="Color"
                  value={form.color}
                  onChangeText={(value) => updateField('color', value)}
                  placeholder="White"
                  editable={!isSold}
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <SelectField
                  label="Year of manufacture"
                  value={form.yearOfManufacture}
                  options={yearOfManufactureOptions}
                  onChange={(value) => updateField('yearOfManufacture', value)}
                  disabled={isSold}
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <FormTextInput
                  label="Usage KM"
                  value={form.usageKm}
                  onChangeText={(value) =>
                    updateField('usageKm', value.replace(/\D/g, '').slice(0, 7))
                  }
                  placeholder="50000"
                  keyboardType="number-pad"
                  editable={!isSold}
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <FormTextInput
                  label="RTO code"
                  value={form.rtoCode}
                  onChangeText={(value) => updateField('rtoCode', value.toUpperCase())}
                  placeholder="AS-01"
                  autoCapitalize="characters"
                  editable={!isSold}
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <SelectField
                  label="Registration State"
                  value={form.registrationState}
                  options={indianStateOptions}
                  onChange={(value) => updateField('registrationState', value)}
                  searchable
                  disabled={isSold}
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldGroup}>
              <SelectField
                label="Transmission type"
                value={form.transmissionType}
                options={transmissionTypeOptions}
                onChange={(value) => updateField('transmissionType', value)}
                disabled={isSold}
              />
            </View>

          </View>

          {errorMessage ? (
            <Text style={[Typography.caption, styles.errorText, { color: colors.error }]}>
              {errorMessage}
            </Text>
          ) : null}

          {!isSold ? (
            <Button
              label="Save changes"
              onPress={handleSubmit}
              disabled={!isFormComplete(form) || isSubmitting}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          ) : null}
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
  },
  scroll: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingContent: {
    flex: 1,
    paddingTop: 18,
  },
  content: {
    paddingTop: 17,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
  },
  soldNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  soldText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldGroup: {
    gap: 8,
    marginBottom: 20,
  },
  errorText: {
    marginTop: 8,
    marginBottom: -8,
    lineHeight: 17,
  },
  submitButton: {
    marginTop: 28,
  },
});
