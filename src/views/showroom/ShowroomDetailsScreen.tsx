import { useEffect, useState, useCallback } from 'react';
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
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Grid, FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getShowroom } from '@/services';
import { BackButton, SkeletonBox } from '@/components/ui';

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

export function ShowroomDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showroom, setShowroom] = useState<ShowroomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;

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
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load showroom details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShowroom();
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      if (id && showroom?.id) {
        loadShowroom();
      }
    }, [id, showroom?.id])
  );

  const handleEdit = () => {
    router.push({
      pathname: '/showroom/edit',
      params: { id: showroom?.id.toString() },
    });
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
            <SkeletonBox width="100%" height={180} borderRadius={12} style={{ marginTop: 8 }} />
            <SkeletonBox width="100%" height={120} borderRadius={12} />
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
        {/* Banner/Logo Section */}
        <View style={styles.bannerContainer}>
          {showroom.showroom_banner ? (
            <Image
              source={{ uri: showroom.showroom_banner }}
              style={styles.banner}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: colors.primary }]}>
              <Ionicons name="storefront" size={60} color={colors['on-primary']} />
            </View>
          )}
          <View style={[styles.backButtonOverlay, { paddingHorizontal: horizontalPadding }]}>
            <BackButton isDark={!showroom.showroom_banner} />
          </View>
          {/* Floating Edit Button */}
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.editFloatingButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.9 : 1 }]
              },
            ]}>
            <Ionicons name="pencil" size={18} color={colors['on-primary']} />
          </Pressable>
        </View>

        {/* Logo and Info Section */}
        <View style={[styles.infoSection, { paddingHorizontal: horizontalPadding }]}>
          {/* Logo */}
          {showroom.showroom_logo && (
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: showroom.showroom_logo }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Name and Role */}
          <Text style={[styles.name, { color: colors['on-surface'] }]}>
            {showroom.name}
          </Text>
          <Text style={[styles.roleLine, { color: colors['on-surface-variant'] }]}>
            {showroom.role?.charAt(0).toUpperCase() + showroom.role?.slice(1)} • {showroom.showroom_id}
          </Text>
        </View>


        {/* Details Sections */}
        <View style={[styles.sections, { paddingHorizontal: horizontalPadding }]}>
          {/* Location Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors['on-surface-variant'] }]}>
              Address Details
            </Text>

            <View
              style={[
                styles.detailRow,
                { borderBottomColor: colors.outline },
              ]}>
              <View style={[styles.detailIcon, { backgroundColor: colors['surface-container-high'] }]}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors['on-surface-variant'] }]}>
                  Address
                </Text>
                <Text style={[styles.detailValue, { color: colors['on-surface'] }]}>
                  {showroom.geolocation?.address || 'Not set'}
                </Text>
              </View>
            </View>

            {(showroom.geolocation?.city || showroom.geolocation?.state) && (
              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: colors.outline },
                ]}>
                <View style={[styles.detailIcon, { backgroundColor: colors['surface-container-high'] }]}>
                  <Ionicons name="map-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors['on-surface-variant'] }]}>
                    City / State
                  </Text>
                  <Text style={[styles.detailValue, { color: colors['on-surface'] }]}>
                    {[showroom.geolocation?.city, showroom.geolocation?.state]
                      .filter(Boolean)
                      .join(', ') || 'Not set'}
                  </Text>
                </View>
              </View>
            )}

            {showroom.geolocation?.pincode && (
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: colors['surface-container-high'] }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors['on-surface-variant'] }]}>
                    Pincode
                  </Text>
                  <Text style={[styles.detailValue, { color: colors['on-surface'] }]}>
                    {showroom.geolocation.pincode}
                  </Text>
                </View>
              </View>
            )}
          </View>

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
  editFloatingButton: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  name: {
    fontSize: 26,
    fontWeight: '600',
  },
  roleLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  sections: {
    gap: 20,
  },
  section: {
    gap: 0,
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
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
