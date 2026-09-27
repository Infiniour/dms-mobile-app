import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Grid, FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { createShowroom } from '@/services';
import { BackButton } from '@/components/ui';
import { FormInput, FormImageField, FormSection } from '@/components/forms';

type ImageAsset = {
  uri: string;
  name?: string;
  type?: string;
};

export function ShowroomCreateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [logo, setLogo] = useState<ImageAsset | null>(null);
  const [banner, setBanner] = useState<ImageAsset | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);

  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;

  const pickImage = async (type: 'logo' | 'banner') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const imageAsset: ImageAsset = {
          uri: asset.uri,
          name: asset.fileName || `${type}.jpg`,
          type: asset.type === 'video' ? 'image/jpeg' : asset.mimeType || 'image/jpeg',
        };

        if (type === 'logo') {
          setLogo(imageAsset);
          setLogoUri(asset.uri);
        } else {
          setBanner(imageAsset);
          setBannerUri(asset.uri);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Showroom name is required');
      return;
    }

    setIsSaving(true);
    try {
      await createShowroom({
        name: name.trim(),
        geolocation: {
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
          lat: lat.trim() ? parseFloat(lat) : undefined,
          lng: lng.trim() ? parseFloat(lng) : undefined,
        },
        logo: logo || undefined,
        banner: banner || undefined,
      });

      Alert.alert('Success', 'Showroom created successfully');
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create showroom');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <BackButton />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={[styles.title, { color: colors['on-surface'] }]}>Add Showroom</Text>
        <Text style={[styles.subtitle, { color: colors['on-surface-variant'] }]}>
          Create a new dealership location
        </Text>

        {/* Banner Section First */}
        <FormImageField
          label="Banner"
          type="banner"
          imageUri={bannerUri}
          onPress={() => pickImage('banner')}
          backgroundColor={colors['surface-container-high']}
          iconColor={colors.primary}
          labelColor={colors['on-surface-variant']}
          borderColor={colors.outline}
        />

        {/* Logo Section */}
        <FormImageField
          label="Logo"
          type="logo"
          imageUri={logoUri}
          onPress={() => pickImage('logo')}
          backgroundColor={colors['surface-container-high']}
          iconColor={colors.primary}
          labelColor={colors['on-surface-variant']}
          borderColor={colors.outline}
        />

        {/* Basic Info Section */}
        <FormSection title="Basic Info" titleColor={colors['on-surface-variant']}>
          <FormInput
            label="Showroom Name"
            placeholder="Enter showroom name"
            value={name}
            onChangeText={setName}
            icon="storefront-outline"
            iconColor={colors.primary}
            backgroundColor={colors['surface-container-high']}
            borderBottomColor={colors.outline}
            labelColor={colors['on-surface-variant']}
            inputColor={colors['on-surface']}
            placeholderColor={colors['on-surface-variant']}
            editable={!isSaving}
            required
          />
        </FormSection>

        {/* Address Details Section */}
        <FormSection title="Address Details" titleColor={colors['on-surface-variant']}>
          <FormInput
            label="Address"
            placeholder="Enter address"
            value={address}
            onChangeText={setAddress}
            icon="location-outline"
            iconColor={colors.primary}
            backgroundColor={colors['surface-container-high']}
            borderBottomColor={colors.outline}
            labelColor={colors['on-surface-variant']}
            inputColor={colors['on-surface']}
            placeholderColor={colors['on-surface-variant']}
            editable={!isSaving}
            multiline
          />
          <FormInput
            label="City"
            placeholder="Enter city"
            value={city}
            onChangeText={setCity}
            icon="map-outline"
            iconColor={colors.primary}
            backgroundColor={colors['surface-container-high']}
            borderBottomColor={colors.outline}
            labelColor={colors['on-surface-variant']}
            inputColor={colors['on-surface']}
            placeholderColor={colors['on-surface-variant']}
            editable={!isSaving}
          />
          <FormInput
            label="State"
            placeholder="Enter state"
            value={state}
            onChangeText={setState}
            icon="map-outline"
            iconColor={colors.primary}
            backgroundColor={colors['surface-container-high']}
            borderBottomColor={colors.outline}
            labelColor={colors['on-surface-variant']}
            inputColor={colors['on-surface']}
            placeholderColor={colors['on-surface-variant']}
            editable={!isSaving}
          />
          <FormInput
            label="Pincode"
            placeholder="Enter pincode"
            value={pincode}
            onChangeText={setPincode}
            icon="mail-outline"
            iconColor={colors.primary}
            backgroundColor={colors['surface-container-high']}
            borderBottomColor={colors.outline}
            labelColor={colors['on-surface-variant']}
            inputColor={colors['on-surface']}
            placeholderColor={colors['on-surface-variant']}
            keyboardType="numeric"
            editable={!isSaving}
          />
        </FormSection>

        {/* Location Coordinates Section */}
        <FormSection title="Location Coordinates" titleColor={colors['on-surface-variant']}>
          <FormInput
            label="Latitude"
            placeholder="e.g., 37.4224"
            value={lat}
            onChangeText={setLat}
            icon="compass-outline"
            iconColor={colors.primary}
            backgroundColor={colors['surface-container-high']}
            borderBottomColor={colors.outline}
            labelColor={colors['on-surface-variant']}
            inputColor={colors['on-surface']}
            placeholderColor={colors['on-surface-variant']}
            keyboardType="decimal-pad"
            editable={!isSaving}
          />
          <FormInput
            label="Longitude"
            placeholder="e.g., -122.0822"
            value={lng}
            onChangeText={setLng}
            icon="compass-outline"
            iconColor={colors.primary}
            backgroundColor={colors['surface-container-high']}
            borderBottomColor={colors.outline}
            labelColor={colors['on-surface-variant']}
            inputColor={colors['on-surface']}
            placeholderColor={colors['on-surface-variant']}
            keyboardType="decimal-pad"
            editable={!isSaving}
          />
        </FormSection>

        {/* Create Button */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={handleCreate}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.createButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isSaving ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}>
            <Ionicons name="add-circle" size={20} color={colors['on-primary']} />
            <Text style={[styles.createButtonText, { color: colors['on-primary'] }]}>
              {isSaving ? 'Creating...' : 'Create Showroom'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    fontWeight: '600',
  },
});
