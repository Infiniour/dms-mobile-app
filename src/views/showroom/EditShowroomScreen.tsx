import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography, Grid } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { resolvePrimaryShowroomId } from '@/utils/showroom';
import { updateShowroom, listShowrooms } from '@/services';
import { BackButton, SkeletonBox, FloatingField } from '@/components/ui';

type ShowroomData = {
  id?: number;
  name?: string | null;
  geolocation?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    lat?: number;
    lng?: number;
  };
};

export function EditShowroomScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [showroomName, setShowroomName] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentShowroom, setCurrentShowroom] = useState<ShowroomData | null>(null);
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;

  useEffect(() => {
    const loadShowroom = async () => {
      try {
        const showroomId = await resolvePrimaryShowroomId();
        if (!showroomId) {
          Alert.alert('Error', 'No showroom found');
          router.back();
          return;
        }

        const response = await listShowrooms();
        const data = (response as unknown as { data?: { showrooms?: any[] } })?.data;
        const showroom = data?.showrooms?.find((s: any) => s.id === showroomId);

        if (showroom) {
          setCurrentShowroom(showroom);
          setShowroomName(showroom.name || '');
          const geo = showroom.geolocation;
          if (geo && (geo.address || geo.city || geo.state)) {
            setLocation(
              [geo.address, geo.city, geo.state].filter(Boolean).join(', ')
            );
          }
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load showroom details');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadShowroom();
  }, []);

  const handleSaveChanges = async () => {
    if (!showroomName.trim()) {
      Alert.alert('Error', 'Showroom name is required');
      return;
    }

    if (!currentShowroom?.id) {
      Alert.alert('Error', 'Showroom ID not found');
      return;
    }

    setIsLoading(true);
    try {
      const geolocation = location.trim() ? { address: location.trim() } : undefined;

      await updateShowroom({
        showroomId: currentShowroom.id,
        name: showroomName.trim(),
        geolocation,
        logo: undefined,
        banner: undefined,
        removeLogo: false,
        removeBanner: false,
      });

      Alert.alert('Success', 'Showroom details updated successfully');
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update showroom');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <BackButton />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={[Typography.hero2, styles.title, { color: colors['on-surface'] }]}>
          Edit Showroom
        </Text>
        <Text style={[Typography.body, styles.subtitle, { color: colors['on-surface-variant'] }]}>
          Update your dealership details
        </Text>

        {isLoadingData ? (
          <>
            <SkeletonBox width="100%" height={160} borderRadius={24} style={{ marginTop: 8 }} />
            <View style={styles.fieldsContainer}>
              {Array(5)
                .fill(null)
                .map((_, index) => (
                  <View key={index} style={styles.fieldGroup}>
                    <SkeletonBox width="30%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                    <SkeletonBox width="100%" height={48} borderRadius={12} />
                  </View>
                ))}
            </View>
          </>
        ) : (
          <>
            {/* Logo/Image Upload Area */}
            <View
              style={[
                styles.imageUploadArea,
                { backgroundColor: colors['surface-container-low'] },
              ]}>
              <View style={[styles.shopIcon, { backgroundColor: colors['surface-container-highest'] }]}>
                <Ionicons name="storefront-outline" size={48} color={colors.primary} />
              </View>
              <Pressable
                style={[styles.editIconButton, { backgroundColor: colors.primary }]}>
                <Ionicons name="pencil" size={20} color={colors['on-primary']} />
              </Pressable>
            </View>

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
          <FloatingField
            label="Showroom name"
            icon="storefront-outline"
            value={showroomName}
            onChangeText={setShowroomName}
            editable={!isLoading}
          />

          <FloatingField
            label="Location"
            icon="location-outline"
            value={location}
            onChangeText={setLocation}
            editable={!isLoading}
          />

          <FloatingField
            label="Contact number"
            icon="call-outline"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            editable={!isLoading}
          />

          {/* GST Number */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors['on-surface'] }]}>
              GST number
            </Text>
            <Pressable
              style={[styles.fieldInputWrapper, { borderColor: colors.outline }]}>
              <Ionicons name="document-outline" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.fieldPlaceholder,
                  { color: gstNumber ? colors['on-surface'] : colors['on-surface-variant'] },
                ]}>
                {gstNumber || 'Add GST number'}
              </Text>
            </Pressable>
          </View>

          {/* Business Hours */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors['on-surface'] }]}>
              Business hours
            </Text>
            <Pressable
              style={[styles.fieldInputWrapper, { borderColor: colors.outline }]}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.fieldPlaceholder,
                  { color: businessHours ? colors['on-surface'] : colors['on-surface-variant'] },
                ]}>
                {businessHours || 'Set business hours'}
              </Text>
            </Pressable>
          </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSaveChanges}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: isLoading ? colors['surface-container-high'] : colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.saveButtonText,
                  {
                    color: isLoading ? colors['on-surface-variant'] : colors['on-primary'],
                  },
                ]}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 32,
    gap: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -8,
  },
  imageUploadArea: {
    height: 160,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
  },
  shopIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldsContainer: {
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    ...Typography.screenTitle,
    fontSize: 15,
    fontWeight: '600',
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  fieldInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
  },
  fieldPlaceholder: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    ...Typography.screenTitle,
    fontSize: 16,
    fontWeight: '600',
  },
});
