import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Grid, FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getShowroom, updateShowroom } from '@/services';
import { BackButton, SkeletonBox, FloatingField } from '@/components/ui';

type ShowroomDetails = {
  id: number;
  showroom_id: string;
  name: string;
  showroom_logo?: string | null;
  showroom_banner?: string | null;
  geolocation?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    lat?: number;
    lng?: number;
  };
  role: string;
};

type ImageAsset = {
  uri: string;
  name?: string;
  type?: string;
};

export function ShowroomEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showroom, setShowroom] = useState<ShowroomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [logo, setLogo] = useState<ImageAsset | null>(null);
  const [banner, setBanner] = useState<ImageAsset | null>(null);
  const [logoDisplayUri, setLogoDisplayUri] = useState<string | null>(null);
  const [bannerDisplayUri, setBannerDisplayUri] = useState<string | null>(null);

  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;

  useEffect(() => {
    const loadShowroom = async () => {
      try {
        if (!id) {
          Alert.alert('Error', 'Showroom ID not provided');
          router.back();
          return;
        }

        const response = await getShowroom(Number(id));
        const data = (response as unknown as { data?: ShowroomDetails })?.data;
        setShowroom(data ?? null);

        if (data) {
          setName(data.name || '');
          setAddress(data.geolocation?.address || '');
          setCity(data.geolocation?.city || '');
          setState(data.geolocation?.state || '');
          setPincode(data.geolocation?.pincode || '');
          setLogoDisplayUri(data.showroom_logo || null);
          setBannerDisplayUri(data.showroom_banner || null);
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load showroom details');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadShowroom();
  }, [id, router]);

  const pickImage = async (type: 'logo' | 'banner') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.cancelled && result.assets?.[0]) {
        const asset = result.assets[0];
        const imageAsset: ImageAsset = {
          uri: asset.uri,
          name: asset.fileName || `${type}.jpg`,
          type: asset.type === 'video' ? 'image/jpeg' : asset.mimeType || 'image/jpeg',
        };

        if (type === 'logo') {
          setLogo(imageAsset);
          setLogoDisplayUri(asset.uri);
        } else {
          setBanner(imageAsset);
          setBannerDisplayUri(asset.uri);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!showroom || !name.trim()) {
      Alert.alert('Error', 'Showroom name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateShowroom({
        showroomId: showroom.id,
        name: name.trim(),
        geolocation: {
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
          lat: showroom.geolocation?.lat,
          lng: showroom.geolocation?.lng,
        },
        logo: logo || undefined,
        banner: banner || undefined,
      });

      Alert.alert('Success', 'Showroom updated successfully');
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update showroom');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <SkeletonBox width="100%" height={180} borderRadius={0} style={{ marginBottom: 20 }} />
          <View style={{ paddingHorizontal: horizontalPadding, gap: 16 }}>
            <SkeletonBox width="60%" height={32} borderRadius={8} />
            <SkeletonBox width="40%" height={16} borderRadius={8} />
            <SkeletonBox width="100%" height={200} borderRadius={12} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!showroom) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}>
        <View style={[styles.bannerContainer, { backgroundColor: colors.primary }]}>
          <View style={styles.backButtonOverlay}>
            <BackButton />
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Unable to load showroom details
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        <Pressable onPress={() => pickImage('banner')}>
          <View style={styles.bannerContainer}>
            {bannerDisplayUri ? (
              <Image
                source={{ uri: bannerDisplayUri }}
                style={styles.banner}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.bannerPlaceholder, { backgroundColor: colors.primary }]}>
                <Ionicons name="storefront" size={60} color={colors['on-primary']} />
              </View>
            )}
            <View style={[styles.backButtonOverlay, { paddingHorizontal: horizontalPadding }]}>
              <BackButton />
            </View>

            {/* Banner Edit Icon Overlay */}
            <View style={styles.bannerEditOverlay}>
              <View style={[styles.bannerEditIcon, { backgroundColor: colors.primary + '90' }]}>
                <Ionicons name="camera" size={26} color="#fff" />
              </View>
            </View>
          </View>
        </Pressable>

        {/* Logo Section */}
        <View style={[styles.infoSection, { paddingHorizontal: horizontalPadding }]}>
          {/* Logo Edit */}
          <Pressable onPress={() => pickImage('logo')}>
            <View style={styles.logoContainer}>
              {logoDisplayUri ? (
                <Image
                  source={{ uri: logoDisplayUri }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="image-outline" size={32} color={colors.primary} />
                </View>
              )}
              {/* Edit Icon Overlay */}
              <View style={[styles.logoEditIcon, { backgroundColor: colors.primary + '80' }]}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </View>
          </Pressable>

          <FloatingField
            label="Showroom name"
            value={name}
            onChangeText={setName}
            editable={!isSaving}
          />

          {/* Role Display */}
          <Text style={[styles.roleLine, { color: colors['on-surface-variant'] }]}>
            {showroom.role?.charAt(0).toUpperCase() + showroom.role?.slice(1)} • {showroom.showroom_id}
          </Text>
        </View>

        {/* Address Details Section */}
        <View style={[styles.sections, { paddingHorizontal: horizontalPadding, marginTop: 20 }]}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors['on-surface-variant'] }]}>
              Address Details
            </Text>

            <FloatingField
              label="Address"
              icon="location-outline"
              value={address}
              onChangeText={setAddress}
              editable={!isSaving}
              multiline
              numberOfLines={3}
            />

            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <FloatingField
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  editable={!isSaving}
                />
              </View>
              <View style={styles.rowField}>
                <FloatingField
                  label="State"
                  value={state}
                  onChangeText={setState}
                  editable={!isSaving}
                />
              </View>
            </View>

            <FloatingField
              label="Pincode"
              icon="mail-outline"
              value={pincode}
              onChangeText={setPincode}
              editable={!isSaving}
              keyboardType="numeric"
            />

            {/* Location Coordinates (Read-only) */}
            {showroom.geolocation?.lat && showroom.geolocation?.lng && (
              <View style={[styles.inputRow, { borderTopColor: colors.outline, borderTopWidth: 1, paddingTop: 14 }]}>
                <View style={[styles.detailIcon, { backgroundColor: colors['surface-container-high'] }]}>
                  <Ionicons name="pin-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors['on-surface-variant'] }]}>
                    Location Coordinates
                  </Text>
                  <Text style={[styles.coordValue, { color: colors['on-surface'] }]}>
                    📍 {showroom.geolocation.lat.toFixed(4)}° N, {Math.abs(showroom.geolocation.lng).toFixed(4)}° W
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Save Button */}
        <View style={[styles.buttonContainer, { paddingHorizontal: horizontalPadding }]}>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isSaving ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}>
            <Ionicons name="checkmark" size={20} color={colors['on-primary']} />
            <Text style={[styles.saveButtonText, { color: colors['on-primary'] }]}>
              {isSaving ? 'Saving...' : 'Save Changes'}
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  bannerContainer: {
    position: 'relative',
    height: 180,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  bannerEditOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    zIndex: 10,
  },
  bannerEditIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'visible',
    position: 'relative',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  logoEditIcon: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 20,
  },
  nameInput: {
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginHorizontal: 16,
  },
  roleLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  sections: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  detailInput: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputSeparator: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
  },
});
