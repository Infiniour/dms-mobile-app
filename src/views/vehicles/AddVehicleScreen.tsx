import { useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BackButton,
  Button,
  ShowroomPickerModal,
  useAppAlert,
  type ShowroomRole,
} from '@/components/ui';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  assignShowroom,
  createVehicle,
  getProfile,
  updateVehiclePricing,
  uploadVehicleImage,
} from '@/services';
import { useAuthStore } from '@/store';
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
  IconTextInput,
  SelectField,
  formFieldStyles,
} from './components/VehicleFormFields';
import { VehiclePhotosPicker, type VehiclePhoto } from './components/VehiclePhotosPicker';

type ProfileData = {
  showroom_roles?: ShowroomRole[] | null;
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

function createDefaultForm(): VehicleForm {
  return {
    vehicleType: '',
    fuelType: '',
    manufacturer: '',
    model: '',
    variant: '',
    color: '',
    yearOfManufacture: '',
    usageKm: '',
    rtoCode: '',
    registrationState: '',
    registrationNumber: generateRegistrationNumber(),
    transmissionType: '',
    buyingPrice: '',
    askingPrice: '',
  };
}

function generateRegistrationNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const series = `${letters[randomInt(letters.length)]}${letters[randomInt(letters.length)]}`;
  const number = String(randomInt(9000) + 1000);

  return `AS01${series}${number}`;
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function dedupeShowrooms(showrooms: ShowroomRole[]) {
  const byId = new Map<number, ShowroomRole>();

  for (const showroom of showrooms) {
    if (typeof showroom.showroom_id === 'number' && !byId.has(showroom.showroom_id)) {
      byId.set(showroom.showroom_id, showroom);
    }
  }

  return Array.from(byId.values());
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
    form.registrationNumber.replace(/\s/g, '').length > 3 &&
    form.transmissionType.trim().length > 0 &&
    form.buyingPrice.trim().length > 0 &&
    form.askingPrice.trim().length > 0
  );
}

export function AddVehicleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showAlert } = useAppAlert();
  const setPrimaryShowroomId = useAuthStore((s) => s.setPrimaryShowroomId);
  const [form, setForm] = useState<VehicleForm>(() => createDefaultForm());
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingVehicleId, setPendingVehicleId] = useState<number | null>(null);
  const [showroomOptions, setShowroomOptions] = useState<ShowroomRole[]>([]);

  const updateField = (field: keyof VehicleForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const completeAssignment = async (vehicleId: number, showroom: ShowroomRole) => {
    setIsAssigning(true);

    try {
      await assignShowroom({ vehicleId, showroomId: showroom.showroom_id });

      // Pricing requires showroom membership on the vehicle server-side — it
      // 404s if attempted before this assignment, so it can only run now that
      // the vehicle actually belongs to a showroom. A failure here shouldn't
      // block the rest of setup, so it's reported rather than thrown.
      try {
        const now = new Date();

        await updateVehiclePricing({
          vehicleId,
          buyingPrice: Number(form.buyingPrice),
          buyingDate: now.toISOString().slice(0, 10),
          priceTag: Number(form.askingPrice),
          taggedAt: now.toISOString(),
          currency: 'inr',
          remarks: undefined,
        });
      } catch (pricingError) {
        showAlert({
          title: 'Price not set',
          message:
            pricingError instanceof Error
              ? pricingError.message
              : "Vehicle was added, but its price couldn't be saved. You can set it from Edit Vehicle.",
          variant: 'error',
        });
      }

      if (photos.length > 0) {
        const uploadResults = await Promise.allSettled(
          photos.map((photo) => uploadVehicleImage({ vehicleId, label: photo.label, photo }))
        );

        if (__DEV__) {
          console.log('Vehicle photo upload results', uploadResults);
        }
      }

      setPendingVehicleId(null);
      setShowroomOptions([]);
      router.back();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to assign vehicle to showroom.'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const resolveShowroomAssignment = async (vehicleId: number) => {
    const profileResponse = await getProfile();
    const profileData =
      (profileResponse as unknown as { data?: ProfileData })?.data ??
      (profileResponse as unknown as ProfileData);

    if (__DEV__) {
      console.log('Profile showroom_roles for assignment', profileData?.showroom_roles);
    }

    const showrooms = dedupeShowrooms(profileData?.showroom_roles ?? []);

    if (showrooms.length === 0) {
      throw new Error('No showroom found to assign this vehicle.');
    }

    if (showrooms.length === 1) {
      setPrimaryShowroomId(showrooms[0].showroom_id);
      await completeAssignment(vehicleId, showrooms[0]);
      return;
    }

    setPendingVehicleId(vehicleId);
    setShowroomOptions(showrooms);
  };

  const handleSubmit = async () => {
    if (!isFormComplete(form) || isSubmitting) {
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
      const response = await createVehicle(form);
      const responseData =
        (response as unknown as { data?: { id?: number } })?.data ??
        (response as unknown as { id?: number });
      const vehicleId = responseData?.id;

      if (!vehicleId) {
        throw new Error('Vehicle created, but vehicle id is missing from server response.');
      }

      await resolveShowroomAssignment(vehicleId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to add vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Add new{'\n'}vehicle
          </Text>
          <Text style={[Typography.body, styles.subtitle, { color: colors['on-surface'] }]}>
            Add basic inventory details. We need these fields for the create vehicle API.
          </Text>

          <View style={styles.fieldGroup}>
            <FieldLabel label="Photos" />
            <VehiclePhotosPicker photos={photos} onChange={setPhotos} />
          </View>

          <View style={formFieldStyles.formFields}>
            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <FieldLabel label="Buying price" />
                <FormTextInput
                  value={form.buyingPrice}
                  onChangeText={(value) =>
                    updateField('buyingPrice', value.replace(/\D/g, ''))
                  }
                  keyboardType="number-pad"
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <FieldLabel label="Asking price" />
                <FormTextInput
                  value={form.askingPrice}
                  onChangeText={(value) =>
                    updateField('askingPrice', value.replace(/\D/g, ''))
                  }
                  keyboardType="number-pad"
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
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <SelectField
                  label="Fuel type"
                  value={form.fuelType}
                  options={fuelTypeOptions}
                  onChange={(value) => updateField('fuelType', value)}
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <FieldLabel label="Manufacturer" />
                <FormTextInput
                  value={form.manufacturer}
                  onChangeText={(value) => updateField('manufacturer', value)}
                  placeholder="Suzuki"
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <FieldLabel label="Model" />
                <FormTextInput
                  value={form.model}
                  onChangeText={(value) => updateField('model', value)}
                  placeholder="Swift Dzire VXI"
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <FieldLabel label="Variant" />
                <FormTextInput
                  value={form.variant}
                  onChangeText={(value) => updateField('variant', value)}
                  placeholder="LE"
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <FieldLabel label="Color" />
                <FormTextInput
                  value={form.color}
                  onChangeText={(value) => updateField('color', value)}
                  placeholder="White"
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
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <FieldLabel label="Usage KM" />
                <FormTextInput
                  value={form.usageKm}
                  onChangeText={(value) =>
                    updateField('usageKm', value.replace(/\D/g, '').slice(0, 7))
                  }
                  placeholder="50000"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldRow}>
              <View style={formFieldStyles.fieldColumn}>
                <FieldLabel label="RTO code" />
                <FormTextInput
                  value={form.rtoCode}
                  onChangeText={(value) => updateField('rtoCode', value.toUpperCase())}
                  placeholder="AS-01"
                  autoCapitalize="characters"
                />
              </View>
              <View style={formFieldStyles.fieldColumn}>
                <SelectField
                  label="Registration State"
                  value={form.registrationState}
                  options={indianStateOptions}
                  onChange={(value) => updateField('registrationState', value)}
                  searchable
                />
              </View>
            </View>

            <View style={formFieldStyles.fieldGroup}>
              <FieldLabel label="Registration number" />
              <IconTextInput
                icon="car-sport-outline"
                value={form.registrationNumber}
                onChangeText={(value) => updateField('registrationNumber', value.toUpperCase())}
                placeholder="AS01 AB 1234"
                autoCapitalize="characters"
              />
            </View>

            <View style={formFieldStyles.fieldGroup}>
              <SelectField
                label="Transmission type"
                value={form.transmissionType}
                options={transmissionTypeOptions}
                onChange={(value) => updateField('transmissionType', value)}
              />
            </View>
          </View>

          {errorMessage ? (
            <Text style={[Typography.caption, styles.errorText, { color: colors.error }]}>
              {errorMessage}
            </Text>
          ) : null}

          <Button
            label="Continue"
            onPress={handleSubmit}
            disabled={!isFormComplete(form) || isSubmitting || isAssigning}
            loading={isSubmitting || isAssigning}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ShowroomPickerModal
        visible={Boolean(pendingVehicleId && showroomOptions.length > 1)}
        showrooms={showroomOptions}
        isAssigning={isAssigning}
        onClose={() => {
          if (!isAssigning) {
            setPendingVehicleId(null);
            setShowroomOptions([]);
          }
        }}
        onSelect={(showroom) => {
          if (pendingVehicleId) {
            completeAssignment(pendingVehicleId, showroom);
          }
        }}
      />
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
