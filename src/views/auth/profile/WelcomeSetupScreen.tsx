import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BottomSheet, Button, FloatingField, ShowroomPickerModal, type ShowroomRole } from '@/components/ui';
import { FontFamily, Grid, Typography } from '@/constants/theme';
import { useLogout } from '@/hooks/useLogout';
import { useTheme } from '@/hooks/useTheme';
import { normalizeRole } from '@/permissions';
import {
  addVehicleDocument,
  addVehicleExpense,
  assignShowroom,
  createShowroom,
  createVehicle,
  getProfile,
  updateVehiclePricing,
  uploadVehicleImage,
} from '@/services';
import { useAuthStore } from '@/store';
import {
  expenseCategoryOptions,
  fuelTypeOptions,
  indianStateOptions,
  transmissionTypeOptions,
  vehicleTypeOptions,
  yearOfManufactureOptions,
  type ExpenseType,
} from '@/views/vehicles/data';
import { SelectField } from '@/views/vehicles/components/VehicleFormFields';
import { VehiclePhotosPicker, type VehiclePhoto } from '@/views/vehicles/components/VehiclePhotosPicker';
import { DOCUMENT_SLOTS, type DocumentType } from '@/views/vehicles/documents';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type SetupStep = 'welcome' | 'showroom' | 'vehicle' | 'done';
type PickedImage = {
  uri: string;
  name?: string | null;
  type?: string | null;
};
type ProfileData = {
  name?: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  required_name?: boolean;
  has_showrooms?: boolean;
  has_vehicles?: boolean;
  showroom_roles?: ShowroomRole[] | null;
};
type ProfileResponse = {
  data?: ProfileData;
};
type VehicleForm = {
  vehicleType: string;
  manufacturer: string;
  model: string;
  variant: string;
  color: string;
  yearOfManufacture: string;
  rtoCode: string;
  registrationNumber: string;
  registrationState: string;
  usageKm: string;
  fuelType: string;
  transmissionType: string;
  /** Both optional — pricing is a separate API call attempted after the vehicle exists, not required to continue setup. */
  buyingPrice: string;
  askingPrice: string;
};

const tabs = [
  'Welcome',
  'Showroom',
  'Vehicle',
  'Done',
] as const;
const PROFILE_RECHECK_DELAY_MS = 1000;
const DASHBOARD_DELAY_MS = 5000;
function createDefaultVehicleForm(): VehicleForm {
  return {
    vehicleType: '',
    manufacturer: '',
    model: '',
    variant: '',
    color: '',
    yearOfManufacture: '',
    rtoCode: '',
    registrationState: '',
    usageKm: '',
    fuelType: '',
    transmissionType: '',
    registrationNumber: '',
    buyingPrice: '',
    askingPrice: '',
  };
}

// Dev-only test data — never referenced outside a __DEV__ branch, so it
// cannot end up filling a form in a production build.
function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function generateSampleRegistrationNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const series = `${letters[randomInt(letters.length)]}${letters[randomInt(letters.length)]}`;
  const number = String(randomInt(9000) + 1000);

  return `AS01${series}${number}`;
}

const SAMPLE_SHOWROOMS = [
  {
    showroomName: 'Metro Motors',
    address: '12 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  },
  {
    showroomName: 'City Auto Hub',
    address: '45 Anna Salai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600002',
  },
  {
    showroomName: 'Highway Cars',
    address: '8 Residency Road',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781001',
  },
];

const SAMPLE_VEHICLES = [
  { manufacturer: 'Toyota', model: 'Camry', variant: 'LE', color: 'Black', vehicleType: 'car', fuelType: 'petrol' },
  { manufacturer: 'Honda', model: 'City', variant: 'V', color: 'White', vehicleType: 'car', fuelType: 'petrol' },
  { manufacturer: 'Hyundai', model: 'Creta', variant: 'SX', color: 'Blue', vehicleType: 'car', fuelType: 'diesel' },
  { manufacturer: 'Hero', model: 'Splendor', variant: 'Plus', color: 'Red', vehicleType: 'bike', fuelType: 'petrol' },
];

export function WelcomeSetupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isLoggingOut, logout } = useLogout();
  const params = useLocalSearchParams<{ step?: string }>();
  const fullName = useAuthStore((s) => s.fullName);
  const countryCode = useAuthStore((s) => s.countryCode);
  const phoneNumber = useAuthStore((s) => s.phoneNumber);
  const completeProfile = useAuthStore((s) => s.completeProfile);
  const setCanEnterApp = useAuthStore((s) => s.setCanEnterApp);
  const setFullName = useAuthStore((s) => s.setFullName);
  const setProfileContact = useAuthStore((s) => s.setProfileContact);
  const setPrimaryShowroom = useAuthStore((s) => s.setPrimaryShowroom);
  const startsAtVehicle = params.step === 'vehicle';
  const [step, setStep] = useState<SetupStep>(startsAtVehicle ? 'vehicle' : 'welcome');
  const [showroomComplete, setShowroomComplete] = useState(startsAtVehicle);
  const [vehicleComplete, setVehicleComplete] = useState(false);
  const [showroomName, setShowroomName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [showroomState, setShowroomState] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationPinned, setLocationPinned] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isCreatingShowroom, setIsCreatingShowroom] = useState(false);
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false);
  const [isAssigningVehicle, setIsAssigningVehicle] = useState(false);
  const [isCheckingNextStep, setIsCheckingNextStep] = useState(false);
  const [logoImage, setLogoImage] = useState<PickedImage | null>(null);
  const [bannerImage, setBannerImage] = useState<PickedImage | null>(null);
  const [photoPickerTarget, setPhotoPickerTarget] = useState<'logo' | 'banner' | DocumentType | null>(
    null
  );
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(() => createDefaultVehicleForm());
  const [vehiclePhotos, setVehiclePhotos] = useState<VehiclePhoto[]>([]);
  const [documentFiles, setDocumentFiles] = useState<Partial<Record<DocumentType, PickedImage>>>({});
  const [expenseType, setExpenseType] = useState<ExpenseType>('repair');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [pendingVehicleId, setPendingVehicleId] = useState<number | null>(null);
  const [showroomOptions, setShowroomOptions] = useState<ShowroomRole[]>([]);
  const hasShowroomSelection = Boolean(pendingVehicleId && showroomOptions.length > 1);
  const isSubmitting = isCreatingShowroom || isCreatingVehicle || isAssigningVehicle || isCheckingNextStep;
  const readonlyPhoneNumber = formatProfilePhone(countryCode, phoneNumber);
  const activeTab = showroomComplete && step === 'welcome' ? 'Welcome' : tabForStep(step);

  const canContinue = useMemo(() => {
    if (step === 'showroom') {
      return showroomName.trim().length > 1;
    }

    if (step === 'vehicle') {
      return isVehicleFormComplete(vehicleForm);
    }

    return true;
  }, [showroomName, step, vehicleForm]);

  useEffect(() => {
    if (step !== 'done') {
      return undefined;
    }

    const timer = setTimeout(() => {
      setCanEnterApp(true);
      completeProfile(fullName);
      router.replace('/(app)');
    }, DASHBOARD_DELAY_MS);

    return () => clearTimeout(timer);
  }, [completeProfile, fullName, router, setCanEnterApp, step]);

  const applyPickedImage = (
    target: 'logo' | 'banner' | DocumentType,
    asset: ImagePicker.ImagePickerAsset
  ) => {
    const image = {
      uri: asset.uri,
      name: asset.fileName,
      type: asset.mimeType,
    };

    if (target === 'banner') {
      setBannerImage(image);
      return;
    }

    if (target === 'logo') {
      setLogoImage(image);
      return;
    }

    setDocumentFiles((current) => ({ ...current, [target]: image }));
  };

  const handleTakePhoto = async (target: 'logo' | 'banner' | DocumentType) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Camera access needed',
        'Please allow camera access to take a photo.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: target === 'logo' || target === 'banner',
      aspect: target === 'banner' ? [16, 6] : target === 'logo' ? [1, 1] : undefined,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    applyPickedImage(target, result.assets[0]);
  };

  const handleChooseFromLibrary = async (target: 'logo' | 'banner' | DocumentType) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Please allow photo access to select a photo.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: target === 'logo' || target === 'banner',
      aspect: target === 'banner' ? [16, 6] : target === 'logo' ? [1, 1] : undefined,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    applyPickedImage(target, result.assets[0]);
  };

  const handlePickImage = (target: 'logo' | 'banner' | DocumentType) => {
    setPhotoPickerTarget(target);
  };

  const handleClosePhotoPicker = () => {
    setPhotoPickerTarget(null);
  };

  const handleSelectPhotoSource = (source: 'camera' | 'library') => {
    if (!photoPickerTarget) {
      return;
    }

    const target = photoPickerTarget;
    setPhotoPickerTarget(null);

    if (source === 'camera') {
      handleTakePhoto(target);
      return;
    }

    handleChooseFromLibrary(target);
  };

  const handleUseCurrentLocation = async () => {
    if (isFetchingLocation) {
      return;
    }

    setIsFetchingLocation(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Location access needed',
          'Please allow location access to auto-fill showroom address details.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      setLocationPinned(true);

      const [place] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (place) {
        const streetAddress = [place.name, place.street, place.district]
          .filter(Boolean)
          .join(', ');

        setAddress(streetAddress);
        setCity(place.city ?? place.subregion ?? '');
        setShowroomState(place.region ?? '');
        setPincode(place.postalCode ?? '');
      }
    } catch (error) {
      Alert.alert(
        'Location unavailable',
        error instanceof Error ? error.message : 'Unable to fetch your current location.'
      );
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const updateVehicleField = (field: keyof VehicleForm, value: string) => {
    setVehicleForm((current) => ({
      ...current,
      [field]: formatVehicleFieldValue(field, value),
    }));
  };

  // Dev-only shortcuts for exercising these forms repeatedly while testing —
  // the button that calls these only renders when __DEV__ is true.
  const handleFillTestShowroom = () => {
    const sample = SAMPLE_SHOWROOMS[randomInt(SAMPLE_SHOWROOMS.length)];

    setShowroomName(sample.showroomName);
    setAddress(sample.address);
    setCity(sample.city);
    setShowroomState(sample.state);
    setPincode(sample.pincode);
  };

  const handleFillTestVehicle = () => {
    const sample = SAMPLE_VEHICLES[randomInt(SAMPLE_VEHICLES.length)];

    setVehicleForm({
      vehicleType: sample.vehicleType,
      manufacturer: sample.manufacturer,
      model: sample.model,
      variant: sample.variant,
      color: sample.color,
      yearOfManufacture: String(2018 + randomInt(6)),
      rtoCode: 'KA-01',
      registrationNumber: generateSampleRegistrationNumber(),
      registrationState: 'Karnataka',
      usageKm: String(10000 + randomInt(40000)),
      fuelType: sample.fuelType,
      transmissionType: randomInt(2) === 0 ? 'manual' : 'automatic',
      buyingPrice: String(150000 + randomInt(300000)),
      askingPrice: String(200000 + randomInt(400000)),
    });
    setExpenseType('service');
    setExpenseAmount(String(500 + randomInt(3000)));
    setExpensePaidTo('City Motors');
    setExpenseDescription('Routine service before listing');
  };

  const fetchProfileForNextStep = async () => {
    const response = await getProfile();
    const profile = (response as unknown as ProfileResponse).data;

    if (!profile) {
      throw new Error('Profile data missing from server response.');
    }

    if (profile.name) {
      setFullName(profile.name);
    }

    setProfileContact({
      countryCode: profile.country_code ?? undefined,
      phoneNumber: profile.phone_number ?? undefined,
    });

    return profile;
  };

  const moveToNextSetupStep = (profile: ProfileData) => {
    if (profile.required_name) {
      setCanEnterApp(false);
      router.replace('/(setup)/profile');
      return;
    }

    if (!profile.has_showrooms) {
      setCanEnterApp(false);
      setShowroomComplete(false);
      setVehicleComplete(false);
      setStep('showroom');
      return;
    }

    setShowroomComplete(true);

    if (!profile.has_vehicles) {
      setCanEnterApp(false);
      setVehicleComplete(false);
      setStep('vehicle');
      return;
    }

    setCanEnterApp(false);
    setVehicleComplete(true);
    setStep('done');
  };

  const completeVehicleAssignment = async (vehicleId: number, showroom: ShowroomRole) => {
    setIsAssigningVehicle(true);

    try {
      const response = await assignShowroom({
        vehicleId,
        showroomId: showroom.showroom_id,
      });
      const responseBody = getApiResponseBody(response);

      if (__DEV__) {
        console.log('Assign vehicle showroom response', responseBody);
      }

      // Pricing/documents/expense all require showroom membership on the
      // vehicle server-side — they 404 if attempted before this assignment,
      // so they can only run now that the vehicle actually belongs to a showroom.
      const warnings = await applyOptionalVehicleExtras(vehicleId);

      if (warnings.length > 0) {
        Alert.alert('Some details need another look', warnings.join('\n\n'));
      }

      if (vehiclePhotos.length > 0) {
        const uploadResults = await Promise.allSettled(
          vehiclePhotos.map((photo) => uploadVehicleImage({ vehicleId, label: photo.label, photo }))
        );

        if (__DEV__) {
          console.log('Vehicle photo upload results', uploadResults);
        }
      }

      // This flow enters the app directly, so seed the role here too. Whoever
      // just created the showroom during onboarding owns it.
      setPrimaryShowroom({
        showroomId: showroom.showroom_id,
        role: normalizeRole(showroom.role) ?? 'owner',
      });
      setPendingVehicleId(null);
      setShowroomOptions([]);
      setVehicleComplete(true);
      setCanEnterApp(false);
      setStep('done');
    } catch (error) {
      if (__DEV__) {
        console.log('Assign vehicle showroom error', error);
      }
      showApiAlertInProduction(
        'Vehicle assignment failed',
        error,
        'Unable to assign vehicle to showroom.'
      );
    } finally {
      setIsAssigningVehicle(false);
    }
  };

  const resolveShowroomAssignment = async (vehicleId: number, profile: ProfileData) => {
    if (__DEV__) {
      console.log('Profile showroom_roles for assignment', profile.showroom_roles);
    }

    const showrooms = getAssignableShowrooms(profile);

    if (showrooms.length === 0) {
      throw new Error('No showroom found to assign this vehicle.');
    }

    if (showrooms.length === 1) {
      await completeVehicleAssignment(vehicleId, showrooms[0]);
      return;
    }

    setPendingVehicleId(vehicleId);
    setShowroomOptions(showrooms);
  };

  const handleCreateShowroom = async () => {
    if (isCreatingShowroom) {
      return;
    }

    const nextShowroomName = showroomName.trim();

    if (nextShowroomName.length <= 1) {
      Alert.alert('Showroom name needed', 'Please enter your showroom name.');
      return;
    }

    setIsCreatingShowroom(true);

    try {
      const response = await createShowroom({
        name: nextShowroomName,
        geolocation: {
          address,
          city,
          state: showroomState,
          pincode,
          lat: latitude,
          lng: longitude,
        },
        logo: logoImage,
        banner: bannerImage,
      });
      const responseBody = getApiResponseBody(response);

      if (__DEV__) {
        console.log('Create showroom response', responseBody);
      }

      setShowroomComplete(true);
      setIsCheckingNextStep(true);
      await delay(PROFILE_RECHECK_DELAY_MS);
      const profile = await fetchProfileForNextStep();
      moveToNextSetupStep(profile);
    } catch (error) {
      showApiAlertInProduction('Showroom create failed', error);
    } finally {
      setIsCreatingShowroom(false);
      setIsCheckingNextStep(false);
    }
  };

  // Pricing, documents, and the initial expense are all optional and each hit
  // a different endpoint than vehicle creation itself. None of them should be
  // able to strand onboarding — the vehicle already exists by the time these
  // run, so a failure here is reported back as a warning (with a pointer to
  // where it can be finished later) rather than blocking the Done step.
  const applyOptionalVehicleExtras = async (vehicleId: number): Promise<string[]> => {
    const warnings: string[] = [];
    const buyingPriceValue = Number(vehicleForm.buyingPrice);
    const askingPriceValue = Number(vehicleForm.askingPrice);

    if (vehicleForm.buyingPrice.trim() && vehicleForm.askingPrice.trim()) {
      try {
        const now = new Date();

        await updateVehiclePricing({
          vehicleId,
          buyingPrice: buyingPriceValue,
          buyingDate: now.toISOString().slice(0, 10),
          priceTag: askingPriceValue,
          taggedAt: now.toISOString(),
          currency: 'inr',
          remarks: undefined,
        });
      } catch {
        warnings.push("Price wasn't set — you can add it later from the vehicle's Edit page.");
      }
    }

    const pendingDocuments = DOCUMENT_SLOTS.filter((slot) => documentFiles[slot.type]);

    if (pendingDocuments.length > 0) {
      const results = await Promise.allSettled(
        pendingDocuments.map((slot) => {
          const file = documentFiles[slot.type];

          return addVehicleDocument(vehicleId, {
            documentType: slot.type,
            file: { uri: file!.uri, name: file!.name ?? undefined, type: file!.type ?? undefined },
          });
        })
      );

      const failedCount = results.filter((result) => result.status === 'rejected').length;

      if (failedCount > 0) {
        warnings.push(
          `${failedCount} of ${pendingDocuments.length} document${pendingDocuments.length === 1 ? '' : 's'} couldn't be uploaded — add ${failedCount === 1 ? 'it' : 'them'} later from the vehicle's Documents page.`
        );
      }
    }

    const expenseAmountValue = Number(expenseAmount.replace(/\D/g, ''));

    if (expenseAmountValue > 0) {
      try {
        await addVehicleExpense({
          vehicleId,
          type: expenseType,
          amount: expenseAmountValue,
          paidTo: expensePaidTo.trim(),
          description: expenseDescription.trim(),
          date: new Date().toISOString(),
        });
      } catch {
        warnings.push("Expense wasn't saved — you can add it later from the vehicle's Expenses page.");
      }
    }

    return warnings;
  };

  const handleCreateVehicle = async () => {
    if (isCreatingVehicle) {
      return;
    }

    if (!isVehicleFormComplete(vehicleForm)) {
      Alert.alert('Vehicle details needed', 'Please fill all required vehicle details.');
      return;
    }

    setIsCreatingVehicle(true);

    try {
      if (__DEV__) {
        console.log('Create vehicle form', vehicleForm);
      }

      const response = await createVehicle(vehicleForm);
      const responseBody = getApiResponseBody(response);

      if (__DEV__) {
        console.log('Create vehicle response', responseBody);
      }

      const vehicleId = getCreatedVehicleId(responseBody);

      if (!vehicleId) {
        throw new Error('Vehicle created, but vehicle id is missing from server response.');
      }

      setVehicleNumber(vehicleForm.registrationNumber);
      setIsCheckingNextStep(true);
      await delay(PROFILE_RECHECK_DELAY_MS);
      const profile = await fetchProfileForNextStep();
      await resolveShowroomAssignment(vehicleId, profile);
    } catch (error) {
      if (__DEV__) {
        console.log('Create vehicle error', error);
      }
      showApiAlertInProduction('Vehicle create failed', error, 'Unable to create vehicle.');
    } finally {
      setIsCreatingVehicle(false);
      setIsCheckingNextStep(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'You can finish setting up your dealership later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handlePrimaryAction = async () => {
    if (step === 'welcome' && !showroomComplete) {
      setStep('showroom');
      return;
    }

    if (step === 'welcome' && showroomComplete) {
      setStep('vehicle');
      return;
    }

    if (step === 'showroom') {
      await handleCreateShowroom();
      return;
    }

    if (step === 'vehicle') {
      await handleCreateVehicle();
      return;
    }

    completeProfile(fullName);
    setCanEnterApp(true);
    router.replace('/(app)');
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={8}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.tabsFlex}>
              <StepTabs
                activeTab={activeTab}
                showroomComplete={showroomComplete}
                vehicleComplete={vehicleComplete}
              />
            </View>
            <Pressable
              onPress={handleLogout}
              disabled={isLoggingOut}
              hitSlop={8}
              style={({ pressed }) => [
                styles.logoutButton,
                {
                  borderColor: colors.outline,
                  opacity: pressed || isLoggingOut ? 0.6 : 1,
                },
              ]}>
              <Ionicons name="log-out-outline" size={16} color={colors['on-surface-variant']} />
            </Pressable>
          </View>

          <ScrollView
            key={step}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {step === 'welcome' ? (
              <WelcomePart
                showroomComplete={showroomComplete}
                vehicleComplete={vehicleComplete}
                onShowroomPress={() => setStep('showroom')}
                onVehiclePress={() => showroomComplete && setStep('vehicle')}
              />
            ) : null}

            {step === 'showroom' ? (
              <ShowroomPart
                showroomName={showroomName}
                address={address}
                city={city}
                showroomState={showroomState}
                pincode={pincode}
                phoneNumber={readonlyPhoneNumber}
                logoImageUri={logoImage?.uri}
                bannerImageUri={bannerImage?.uri}
                locationPinned={locationPinned}
                isFetchingLocation={isFetchingLocation}
                onShowroomNameChange={setShowroomName}
                onAddressChange={setAddress}
                onCityChange={setCity}
                onShowroomStateChange={setShowroomState}
                onPincodeChange={setPincode}
                onPickLogo={() => handlePickImage('logo')}
                onPickBanner={() => handlePickImage('banner')}
                onLocationPress={handleUseCurrentLocation}
                onFillTestData={__DEV__ ? handleFillTestShowroom : undefined}
              />
            ) : null}

            {step === 'vehicle' ? (
              <VehiclePart
                form={vehicleForm}
                onFieldChange={updateVehicleField}
                photos={vehiclePhotos}
                onPhotosChange={setVehiclePhotos}
                onFillTestData={__DEV__ ? handleFillTestVehicle : undefined}
                documentFiles={documentFiles}
                onPickDocument={handlePickImage}
                onRemoveDocument={(type) =>
                  setDocumentFiles((current) => {
                    const next = { ...current };
                    delete next[type];
                    return next;
                  })
                }
                expenseType={expenseType}
                onExpenseTypeChange={setExpenseType}
                expenseAmount={expenseAmount}
                onExpenseAmountChange={setExpenseAmount}
                expensePaidTo={expensePaidTo}
                onExpensePaidToChange={setExpensePaidTo}
                expenseDescription={expenseDescription}
                onExpenseDescriptionChange={setExpenseDescription}
              />
            ) : null}

            {step === 'done' ? (
              <DonePart showroomName={showroomName} vehicleNumber={vehicleNumber} />
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={buttonLabel(step, {
                isCheckingNextStep,
                isCreatingShowroom,
                isCreatingVehicle,
                isAssigningVehicle,
              })}
              onPress={handlePrimaryAction}
              disabled={!canContinue || isSubmitting || hasShowroomSelection}
              loading={(step === 'showroom' || step === 'vehicle') && isSubmitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
      <ShowroomPickerModal
        visible={hasShowroomSelection}
        showrooms={showroomOptions}
        isAssigning={isAssigningVehicle}
        onClose={() => {
          if (!isAssigningVehicle) {
            setPendingVehicleId(null);
            setShowroomOptions([]);
          }
        }}
        onSelect={(showroom) => {
          if (pendingVehicleId) {
            completeVehicleAssignment(pendingVehicleId, showroom);
          }
        }}
      />
      <PhotoSourceSheet
        visible={Boolean(photoPickerTarget)}
        onClose={handleClosePhotoPicker}
        onSelectSource={handleSelectPhotoSource}
      />
    </SafeAreaView>
  );
}

function tabForStep(step: SetupStep) {
  if (step === 'showroom') {
    return 'Showroom';
  }

  if (step === 'vehicle') {
    return 'Vehicle';
  }

  if (step === 'done') {
    return 'Done';
  }

  return 'Welcome';
}

function formatProfilePhone(countryCode: string, phoneNumber: string) {
  if (!phoneNumber) {
    return '';
  }

  const digits = phoneNumber.replace(/\D/g, '');
  const code = countryCode.replace(/\D/g, '');
  const localNumber = code && digits.startsWith(code) ? digits.slice(code.length) : digits;

  return code ? `+${code} - ${localNumber}` : localNumber;
}

function getApiResponseBody(response: unknown) {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data?: unknown }).data;
  }

  return response;
}

function getCreatedVehicleId(response: unknown) {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const vehicleId = (response as { id?: unknown }).id;
  return typeof vehicleId === 'number' ? vehicleId : null;
}

function getAssignableShowrooms(profile: ProfileData) {
  const byId = new Map<number, ShowroomRole>();

  for (const showroom of profile.showroom_roles ?? []) {
    if (typeof showroom.showroom_id === 'number' && !byId.has(showroom.showroom_id)) {
      byId.set(showroom.showroom_id, showroom);
    }
  }

  return Array.from(byId.values());
}

function isVehicleFormComplete(form: VehicleForm) {
  return (
    form.vehicleType.trim().length > 0 &&
    form.manufacturer.trim().length > 0 &&
    form.model.trim().length > 0 &&
    form.variant.trim().length > 0 &&
    form.color.trim().length > 0 &&
    Number(form.yearOfManufacture) > 1900 &&
    form.rtoCode.trim().length > 1 &&
    form.registrationNumber.replace(/\s/g, '').length > 3 &&
    form.registrationState.trim().length > 0 &&
    Number(form.usageKm) >= 0 &&
    form.fuelType.trim().length > 0 &&
    form.transmissionType.trim().length > 0
  );
}

function formatVehicleFieldValue(field: keyof VehicleForm, value: string) {
  if (field === 'yearOfManufacture') {
    return value.replace(/\D/g, '').slice(0, 4);
  }

  if (field === 'usageKm') {
    return value.replace(/\D/g, '').slice(0, 7);
  }

  if (field === 'rtoCode' || field === 'registrationNumber') {
    return value.toUpperCase();
  }

  if (field === 'vehicleType' || field === 'fuelType' || field === 'transmissionType') {
    return value.toLowerCase();
  }

  return value;
}

function getApiErrorMessage(error: unknown, fallback = 'Unable to create showroom.') {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as { body?: unknown }).body;
    return toAlertMessage(body, fallback);
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    return toAlertMessage(response?.data, fallback);
  }

  return toAlertMessage(error, fallback);
}

function showApiAlertInProduction(title: string, error: unknown, fallback?: string) {
  if (__DEV__) {
    return;
  }

  Alert.alert(title, getApiErrorMessage(error, fallback));
}

function toAlertMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'object') {
    const payload = value as { message?: unknown; error?: unknown };
    const nestedMessage = toAlertMessage(payload.message ?? payload.error, '');

    if (nestedMessage) {
      return nestedMessage;
    }

    try {
      const text = JSON.stringify(value, null, 2);
      return text.length > 900 ? `${text.slice(0, 900)}...` : text;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buttonLabel(
  step: SetupStep,
  state: {
    isCheckingNextStep?: boolean;
    isCreatingShowroom?: boolean;
    isCreatingVehicle?: boolean;
    isAssigningVehicle?: boolean;
  } = {}
) {
  if (state.isCheckingNextStep) {
    return 'Checking next step';
  }

  if (state.isCreatingShowroom) {
    return 'Saving showroom';
  }

  if (state.isCreatingVehicle) {
    return 'Saving vehicle';
  }

  if (state.isAssigningVehicle) {
    return 'Assigning showroom';
  }

  if (step === 'welcome') {
    return 'Next';
  }

  if (step === 'done') {
    return 'Go to Dashboard';
  }

  return 'Continue';
}

function StepTabs({
  activeTab,
  showroomComplete,
  vehicleComplete,
}: {
  activeTab: (typeof tabs)[number];
  showroomComplete: boolean;
  vehicleComplete: boolean;
}) {
  const { colors } = useTheme();
  const activeIndex = tabs.indexOf(activeTab);
  const completeIndex =
    vehicleComplete ? 3 : activeTab === 'Vehicle' ? 2 : showroomComplete ? 1 : activeIndex;
  // The line sits behind the circles as one continuous bar rather than a
  // per-segment connector, so circles land exactly evenly spaced (and
  // centered under their labels) regardless of how many steps there are.
  const halfItemInset = `${100 / (tabs.length * 2)}%` as const;
  const fillFraction = Math.min(Math.max(completeIndex / (tabs.length - 1), 0), 1);

  return (
    <View style={styles.stepperWrap}>
      <View
        style={[
          styles.stepperTrack,
          { left: halfItemInset, right: halfItemInset, backgroundColor: colors['surface-container'] },
        ]}>
        <View
          style={[
            styles.stepperTrackFill,
            { width: `${fillFraction * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <View style={styles.stepperRow}>
        {tabs.map((tab, index) => {
          const isComplete = index < completeIndex;
          const isActive = tab === activeTab;
          const circleBackground = isComplete || isActive ? colors.primary : colors['surface-container'];
          const circleContentColor = isComplete || isActive ? colors['on-primary'] : colors['on-surface-variant'];

          return (
            <View key={tab} style={styles.stepItem}>
              <View style={[styles.stepCircle, { backgroundColor: circleBackground }]}>
                {isComplete ? (
                  <Ionicons name="checkmark" size={13} color={circleContentColor} />
                ) : (
                  <Text style={[Typography.micro, styles.stepNumber, { color: circleContentColor }]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  Typography.micro,
                  styles.stepLabel,
                  {
                    color: isActive ? colors.primary : colors['on-surface-variant'],
                    fontFamily: isActive ? Typography.screenTitle.fontFamily : FontFamily.medium,
                  },
                ]}>
                {tab}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function WelcomePart({
  showroomComplete,
  vehicleComplete,
  onShowroomPress,
  onVehiclePress,
}: {
  showroomComplete: boolean;
  vehicleComplete: boolean;
  onShowroomPress: () => void;
  onVehiclePress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.welcomePart}>
      <View style={styles.header}>
        <Text style={[Typography.hero2, styles.welcomeTitle, { color: colors['on-background'] }]}>
          Welcome!
        </Text>
        <Text style={[Typography.body, styles.subtitleLeft, { color: colors['on-surface'] }]}>
          Let's set up your dealership in 3 quick steps so you can start managing your inventory.
        </Text>
      </View>

      <View style={styles.taskStack}>
        <SetupTaskCard
          title="Add your showroom"
          subtitle="Name, location & contact"
          icon="storefront-outline"
          state={showroomComplete ? 'complete' : 'active'}
          onPress={onShowroomPress}
        />
        <SetupTaskCard
          title="Add your first vehicle"
          subtitle="Register via number plate"
          icon="car-sport-outline"
          state={vehicleComplete ? 'complete' : showroomComplete ? 'active' : 'locked'}
          onPress={onVehiclePress}
        />
      </View>
    </View>
  );
}

function BrandUpload({
  logoImageUri,
  bannerImageUri,
  onPickLogo,
  onPickBanner,
}: {
  logoImageUri?: string;
  bannerImageUri?: string;
  onPickLogo: () => void;
  onPickBanner: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.brandWrap}>
      <Pressable
        onPress={onPickBanner}
        style={[
          styles.bannerUpload,
          {
            backgroundColor: colors['surface-container'],
            borderColor: colors.outline,
          },
        ]}>
        {bannerImageUri ? (
          <Image source={{ uri: bannerImageUri }} style={styles.bannerImage} />
        ) : (
          <>
            <Ionicons name="image-outline" size={34} color={colors.primary} />
            <Text style={[Typography.caption, styles.bannerLabel, { color: colors.primary }]}>
              Add a banner image
            </Text>
          </>
        )}
        <View style={[styles.editBadge, { backgroundColor: colors.background }]}>
          <Ionicons name="pencil" size={17} color={colors.primary} />
        </View>
      </Pressable>

      <View style={styles.logoRow}>
        <Pressable onPress={onPickLogo} style={styles.logoCluster}>
          <View
            style={[
              styles.logoCircle,
              {
                backgroundColor: colors['surface-container-low'],
                borderColor: colors.background,
              },
            ]}>
            {logoImageUri ? (
              <Image source={{ uri: logoImageUri }} style={styles.logoImage} />
            ) : (
              <Ionicons name="storefront-outline" size={32} color={colors.primary} />
            )}
          </View>
          <View style={[styles.plusBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color={colors['on-primary']} />
          </View>
        </Pressable>
        <Text style={[Typography.caption, styles.logoLabel, { color: colors.primary }]}>
          Add your logo & banner
        </Text>
        <View style={[styles.optionalPill, { backgroundColor: colors['surface-container-high'] }]}>
          <Text style={[Typography.micro, styles.optionalText, { color: colors.primary }]}>
            Optional
          </Text>
        </View>
      </View>
    </View>
  );
}

function SetupTaskCard({
  title,
  subtitle,
  icon,
  state,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  state: 'active' | 'complete' | 'locked';
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const isLocked = state === 'locked';
  const isComplete = state === 'complete';
  const iconBackground = isLocked ? colors['surface-container'] : colors.primary;
  const iconColor = isLocked ? colors['on-surface-variant'] : colors['on-primary'];

  return (
    <Pressable
      disabled={isLocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.taskCard,
        {
          borderColor: isLocked ? colors.outline : colors.primary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={[styles.taskIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>
      <View style={styles.taskText}>
        <Text
          style={[
            Typography.body,
            styles.taskTitle,
            { color: isLocked ? colors['on-surface-variant'] : colors['on-surface'] },
          ]}>
          {title}
        </Text>
        <Text style={[Typography.caption, styles.taskSubtitle, { color: colors['on-surface-variant'] }]}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.taskAction}>
        {isComplete ? (
          <Ionicons name="checkmark-circle" size={34} color={colors.primary} />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={28}
            color={isLocked ? colors['on-surface-variant'] : colors['on-surface']}
          />
        )}
      </View>
    </Pressable>
  );
}

function ShowroomPart({
  showroomName,
  address,
  city,
  showroomState,
  pincode,
  phoneNumber,
  logoImageUri,
  bannerImageUri,
  locationPinned,
  isFetchingLocation,
  onShowroomNameChange,
  onAddressChange,
  onCityChange,
  onShowroomStateChange,
  onPincodeChange,
  onPickLogo,
  onPickBanner,
  onLocationPress,
  onFillTestData,
}: {
  showroomName: string;
  address: string;
  city: string;
  showroomState: string;
  pincode: string;
  phoneNumber: string;
  logoImageUri?: string;
  bannerImageUri?: string;
  locationPinned: boolean;
  isFetchingLocation: boolean;
  onShowroomNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onShowroomStateChange: (value: string) => void;
  onPincodeChange: (value: string) => void;
  onPickLogo: () => void;
  onPickBanner: () => void;
  onLocationPress: () => void;
  /** Dev builds only — the parent only passes this when __DEV__ is true. */
  onFillTestData?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.formPart}>
      {onFillTestData ? <DevFillButton onPress={onFillTestData} /> : null}

      <View style={styles.formHeader}>
        <Text style={[Typography.hero2, styles.formTitle, { color: colors['on-background'] }]}>
          Add your{'\n'}showroom
        </Text>
        <Text style={[Typography.body, styles.formSubtitle, { color: colors['on-surface'] }]}>
          Add showroom details now. Logo, banner, and location fields are optional.
        </Text>
      </View>

      <BrandUpload
        logoImageUri={logoImageUri}
        bannerImageUri={bannerImageUri}
        onPickLogo={onPickLogo}
        onPickBanner={onPickBanner}
      />

      <View style={styles.formFields}>
        <FloatingField
          label="Showroom name"
          icon="storefront-outline"
          value={showroomName}
          onChangeText={onShowroomNameChange}
        />

        {/* Up front, before the address fields it fills in — tapping this is
            meant to replace typing the address by hand, not follow it. Raw
            lat/long values aren't shown anywhere: nothing a showroom owner
            would do with those numbers, they only matter to the map pin. */}
        <Pressable
          onPress={onLocationPress}
          disabled={isFetchingLocation}
          style={({ pressed }) => [
            styles.locationButton,
            {
              borderColor: locationPinned ? colors.primary : colors.outline,
              backgroundColor: locationPinned ? colors['primary-container'] : colors.background,
              opacity: pressed || isFetchingLocation ? 0.75 : 1,
            },
          ]}>
          <Ionicons
            name={isFetchingLocation ? 'sync-outline' : locationPinned ? 'checkmark-circle' : 'location-outline'}
            size={20}
            color={colors.primary}
          />
          <Text style={[Typography.body, styles.locationButtonText, { color: colors.primary }]}>
            {isFetchingLocation
              ? 'Fetching your location...'
              : locationPinned
                ? 'Location pinned — tap to refresh'
                : 'Use current location'}
          </Text>
          {!isFetchingLocation ? (
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          ) : null}
        </Pressable>

        <FloatingField label="Address" value={address} onChangeText={onAddressChange} />

        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <FloatingField label="City" value={city} onChangeText={onCityChange} />
          </View>
          <View style={styles.fieldColumn}>
            <FloatingField label="State" value={showroomState} onChangeText={onShowroomStateChange} />
          </View>
        </View>

        <FloatingField
          label="Pincode"
          value={pincode}
          onChangeText={(value) => onPincodeChange(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
        />

        <FloatingField
          label="Phone number"
          icon="call-outline"
          value={phoneNumber}
          editable={false}
          selectTextOnFocus={false}
        />
      </View>
    </View>
  );
}

function PhotoSourceSheet({
  visible,
  onClose,
  onSelectSource,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectSource: (source: 'camera' | 'library') => void;
}) {
  const { colors } = useTheme();

  const options: { source: 'camera' | 'library'; icon: IconName; label: string }[] = [
    { source: 'camera', icon: 'camera-outline', label: 'Take photo' },
    { source: 'library', icon: 'images-outline', label: 'Choose from library' },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[Typography.title, styles.photoSheetTitle, { color: colors['on-background'] }]}>
        Add photo
      </Text>

      <View style={styles.photoSheetOptions}>
        {options.map((option) => (
          <Pressable
            key={option.source}
            onPress={() => onSelectSource(option.source)}
            style={({ pressed }) => [
              styles.photoSheetOption,
              {
                backgroundColor: colors['surface-container-low'],
                borderColor: colors['outline-variant'],
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <View style={[styles.photoSheetIcon, { backgroundColor: colors['surface-container'] }]}>
              <Ionicons name={option.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[Typography.body, styles.photoSheetLabel, { color: colors['on-surface'] }]}>
              {option.label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors['on-surface-variant']} />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

function VehiclePart({
  form,
  onFieldChange,
  photos,
  onPhotosChange,
  documentFiles,
  onPickDocument,
  onRemoveDocument,
  expenseType,
  onExpenseTypeChange,
  expenseAmount,
  onExpenseAmountChange,
  expensePaidTo,
  onExpensePaidToChange,
  expenseDescription,
  onExpenseDescriptionChange,
  onFillTestData,
}: {
  form: VehicleForm;
  onFieldChange: (field: keyof VehicleForm, value: string) => void;
  photos: VehiclePhoto[];
  onPhotosChange: (photos: VehiclePhoto[]) => void;
  documentFiles: Partial<Record<DocumentType, PickedImage>>;
  onPickDocument: (type: DocumentType) => void;
  onRemoveDocument: (type: DocumentType) => void;
  expenseType: ExpenseType;
  onExpenseTypeChange: (type: ExpenseType) => void;
  expenseAmount: string;
  onExpenseAmountChange: (value: string) => void;
  expensePaidTo: string;
  onExpensePaidToChange: (value: string) => void;
  expenseDescription: string;
  onExpenseDescriptionChange: (value: string) => void;
  /** Dev builds only — the parent only passes this when __DEV__ is true. */
  onFillTestData?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.formPart}>
      {onFillTestData ? <DevFillButton onPress={onFillTestData} /> : null}

      <View style={styles.formHeader}>
        <Text style={[Typography.hero2, styles.formTitle, { color: colors['on-background'] }]}>
          Add your first{'\n'}vehicle
        </Text>
        <Text style={[Typography.body, styles.formSubtitle, { color: colors['on-surface'] }]}>
          Enter the vehicle's details below to add it to your inventory.
        </Text>
      </View>

      <View style={[styles.fieldGroup, styles.photosGroup]}>
        <View style={styles.labelRow}>
          <FieldLabel label="Photos" />
          <View style={[styles.optionalPill, { backgroundColor: colors['surface-container-high'] }]}>
            <Text style={[Typography.micro, styles.optionalText, { color: colors.primary }]}>
              Optional
            </Text>
          </View>
        </View>
        <VehiclePhotosPicker photos={photos} onChange={onPhotosChange} />
      </View>

      <View style={styles.formFields}>
        {/* The plate is how this vehicle gets identified everywhere else in
            the app, so it leads the form instead of being buried after
            categorization fields nobody looks at first. */}
        <FloatingField
          label="Registration number"
          value={form.registrationNumber}
          onChangeText={(value) => onFieldChange('registrationNumber', value)}
          autoCapitalize="characters"
        />

        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <FloatingField
              label="Manufacturer"
              value={form.manufacturer}
              onChangeText={(value) => onFieldChange('manufacturer', value)}
            />
          </View>
          <View style={styles.fieldColumn}>
            <FloatingField
              label="Model"
              value={form.model}
              onChangeText={(value) => onFieldChange('model', value)}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <FloatingField
              label="Variant"
              value={form.variant}
              onChangeText={(value) => onFieldChange('variant', value)}
            />
          </View>
          <View style={styles.fieldColumn}>
            <FloatingField
              label="Color"
              value={form.color}
              onChangeText={(value) => onFieldChange('color', value)}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <SelectField
              label="Vehicle type"
              value={form.vehicleType}
              options={vehicleTypeOptions}
              onChange={(value) => onFieldChange('vehicleType', value)}
            />
          </View>
          <View style={styles.fieldColumn}>
            <SelectField
              label="Fuel type"
              value={form.fuelType}
              options={fuelTypeOptions}
              onChange={(value) => onFieldChange('fuelType', value)}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <SelectField
              label="Transmission type"
              value={form.transmissionType}
              options={transmissionTypeOptions}
              onChange={(value) => onFieldChange('transmissionType', value)}
            />
          </View>
          <View style={styles.fieldColumn}>
            <SelectField
              label="Year of manufacture"
              value={form.yearOfManufacture}
              options={yearOfManufactureOptions}
              onChange={(value) => onFieldChange('yearOfManufacture', value)}
            />
          </View>
        </View>

        <FloatingField
          label="Usage (KM)"
          value={form.usageKm}
          onChangeText={(value) => onFieldChange('usageKm', value)}
          keyboardType="number-pad"
        />

        {/* Registration authority details — least essential to identifying the
            vehicle day-to-day, so they close out the form instead of
            interrupting the make/model/spec flow above. */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <FloatingField
              label="RTO code"
              value={form.rtoCode}
              onChangeText={(value) => onFieldChange('rtoCode', value)}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.fieldColumn}>
            <SelectField
              label="Registration State"
              value={form.registrationState}
              options={indianStateOptions}
              onChange={(value) => onFieldChange('registrationState', value)}
              searchable
            />
          </View>
        </View>

        {/* Pricing hits a separate API from vehicle creation, so it's kept
            optional here — if it fails after the vehicle is created, that's
            reported as a warning, not a reason to fail this whole step. */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <FloatingField
              label="Buying price"
              value={form.buyingPrice}
              onChangeText={(value) => onFieldChange('buyingPrice', value.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.fieldColumn}>
            <FloatingField
              label="Asking price"
              value={form.askingPrice}
              onChangeText={(value) => onFieldChange('askingPrice', value.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      <View style={[styles.fieldGroup, styles.sectionGroup]}>
        <View style={styles.labelRow}>
          <FieldLabel label="Documents" />
          <OptionalBadge />
        </View>
        <View style={styles.documentList}>
          {DOCUMENT_SLOTS.map((slot) => (
            <DocumentRow
              key={slot.type}
              slot={slot}
              file={documentFiles[slot.type]}
              onAdd={() => onPickDocument(slot.type)}
              onRemove={() => onRemoveDocument(slot.type)}
            />
          ))}
        </View>
      </View>

      <View style={[styles.fieldGroup, styles.sectionGroup]}>
        <View style={styles.labelRow}>
          <FieldLabel label="Log an initial expense" />
          <OptionalBadge />
        </View>

        <View style={styles.chips}>
          {expenseCategoryOptions.map((category) => {
            const selected = category.value === expenseType;

            return (
              <Pressable
                key={category.value}
                onPress={() => onExpenseTypeChange(category.value)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.primary : colors.background,
                    borderColor: selected ? colors.primary : colors.outline,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Text
                  style={[
                    Typography.caption,
                    styles.chipLabel,
                    { color: selected ? colors['on-primary'] : colors['on-surface'] },
                  ]}>
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <FloatingField
              label="Amount"
              value={expenseAmount}
              onChangeText={(value) => onExpenseAmountChange(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.fieldColumn}>
            <FloatingField label="Paid to" value={expensePaidTo} onChangeText={onExpensePaidToChange} />
          </View>
        </View>

        <FloatingField
          label="Description"
          value={expenseDescription}
          onChangeText={onExpenseDescriptionChange}
        />
      </View>
    </View>
  );
}

function OptionalBadge() {
  const { colors } = useTheme();

  return (
    <View style={[styles.optionalPill, { backgroundColor: colors['surface-container-high'] }]}>
      <Text style={[Typography.micro, styles.optionalText, { color: colors.primary }]}>Optional</Text>
    </View>
  );
}

/** Dev-only shortcut to fill a form with plausible sample data while testing. */
function DevFillButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.devFillButton,
        { borderColor: colors.outline, opacity: pressed ? 0.7 : 1 },
      ]}>
      <Ionicons name="flask-outline" size={13} color={colors.primary} />
      <Text style={[Typography.micro, styles.devFillText, { color: colors.primary }]}>
        Fill test data
      </Text>
    </Pressable>
  );
}

function DocumentRow({
  slot,
  file,
  onAdd,
  onRemove,
}: {
  slot: (typeof DOCUMENT_SLOTS)[number];
  file?: PickedImage;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.documentRow, { borderColor: colors.outline }]}>
      <View style={[styles.documentIcon, { backgroundColor: colors['surface-container'] }]}>
        {file ? (
          <Image source={{ uri: file.uri }} style={styles.documentThumb} />
        ) : (
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
        )}
      </View>
      <View style={styles.documentText}>
        <Text style={[Typography.body, styles.documentLabel, { color: colors['on-surface'] }]} numberOfLines={1}>
          {slot.label}
        </Text>
        <Text
          style={[Typography.caption, styles.documentHint, { color: colors['on-surface-variant'] }]}
          numberOfLines={1}>
          {file ? 'Added' : slot.hint}
        </Text>
      </View>
      {file ? (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={colors['on-surface-variant']} />
        </Pressable>
      ) : (
        <Pressable
          onPress={onAdd}
          style={[styles.documentAdd, { borderColor: colors.primary }]}
          hitSlop={8}>
          <Ionicons name="add" size={16} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

function DonePart({ showroomName, vehicleNumber }: { showroomName: string; vehicleNumber: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.donePart}>
      <View style={[styles.doneIcon, { backgroundColor: colors['surface-container'] }]}>
        <Ionicons name="checkmark-circle" size={52} color={colors.primary} />
      </View>
      <Text style={[Typography.hero2, styles.doneTitle, { color: colors['on-background'] }]}>
        You're all set!
      </Text>
      <Text style={[Typography.body, styles.doneSubtitle, { color: colors['on-surface'] }]}>
        {showroomName} is ready with {vehicleNumber || 'your first vehicle'}.
      </Text>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  const { colors } = useTheme();

  return (
    <Text style={[Typography.body, styles.fieldLabel, { color: colors['on-background'] }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Grid.columns.margin,
    paddingTop: 18,
    paddingBottom: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 21,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tabsFlex: {
    flex: 1,
  },
  logoutButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  stepperWrap: {
    paddingTop: 6,
    position: 'relative',
  },
  stepperTrack: {
    position: 'absolute',
    top: 6 + 13,
    height: 2,
    borderRadius: 1,
  },
  stepperTrackFill: {
    height: '100%',
    borderRadius: 1,
  },
  stepperRow: {
    flexDirection: 'row',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 12,
    lineHeight: 14,
    fontFamily: FontFamily.medium,
  },
  stepLabel: {
    fontSize: 12,
    lineHeight: 15,
    marginTop: 8,
  },
  welcomePart: {
    gap: 24,
    paddingTop: 2,
  },
  brandWrap: {
    minHeight: 184,
    marginBottom: 16,
  },
  bannerUpload: {
    height: 132,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerLabel: {
    fontFamily: Typography.caption.fontFamily,
    fontWeight: '500',
  },
  editBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    position: 'absolute',
    left: 18,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
  },
  logoCluster: {
    width: 73,
    height: 73,
  },
  logoCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  plusBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLabel: {
    lineHeight: 18,
    paddingBottom: 7,
    fontFamily: Typography.caption.fontFamily,
    fontWeight: '500',
  },
  optionalPill: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  optionalText: {
    lineHeight: 13,
    fontFamily: Typography.micro.fontFamily,
    fontWeight: '500',
  },
  header: {
    gap: 13,
  },
  welcomeTitle: {
    lineHeight: 38,
  },
  subtitleLeft: {
    fontSize: 15,
    lineHeight: 24,
  },
  taskStack: {
    gap: 18,
  },
  taskCard: {
    minHeight: 94,
    borderRadius: 14,
    borderWidth: 1.25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 20,
  },
  taskIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskText: {
    flex: 1,
    gap: 5,
  },
  taskTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: Typography.screenTitle.fontFamily,
  },
  taskSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  taskAction: {
    width: 34,
    alignItems: 'center',
  },
  formPart: {
    paddingTop: 2,
  },
  devFillButton: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  devFillText: {
    fontFamily: FontFamily.medium,
  },
  formHeader: {
    gap: 18,
    marginBottom: 25,
  },
  formTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: FontFamily.medium,
  },
  formSubtitle: {
    fontSize: 15,
    lineHeight: 23,
  },
  formFields: {
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  photosGroup: {
    marginBottom: 20,
  },
  sectionGroup: {
    marginTop: 24,
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 16,
  },
  fieldColumn: {
    flex: 1,
    gap: 8,
  },
  documentList: {
    gap: 10,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  documentThumb: {
    width: '100%',
    height: '100%',
  },
  documentText: {
    flex: 1,
    gap: 2,
  },
  documentLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  documentHint: {
    fontSize: 12,
  },
  documentAdd: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1.4,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipLabel: {
    fontFamily: FontFamily.medium,
  },
  fieldLabel: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: FontFamily.medium,
  },
  locationButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  locationButtonText: {
    flex: 1,
    fontFamily: FontFamily.medium,
  },
  photoSheetTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  photoSheetOptions: {
    gap: 12,
  },
  photoSheetOption: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  photoSheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSheetLabel: {
    flex: 1,
  },
  donePart: {
    flex: 1,
    minHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    textAlign: 'center',
    lineHeight: 36,
  },
  doneSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingTop: 10,
  },
});
