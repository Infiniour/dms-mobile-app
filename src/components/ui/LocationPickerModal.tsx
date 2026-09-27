import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Map, type CameraRef, type LngLat, type MapRef } from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const INDIA_CENTER: LngLat = [78.6569, 22.9734];

type PickedLocation = {
  latitude: number;
  longitude: number;
};

type LocationPickerModalProps = {
  visible: boolean;
  initialLatitude?: number;
  initialLongitude?: number;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
};

export function LocationPickerModal({
  visible,
  initialLatitude,
  initialLongitude,
  onClose,
  onConfirm,
}: LocationPickerModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const centerRef = useRef<LngLat>(INDIA_CENTER);
  const pendingCenterRef = useRef<LngLat | null>(null);
  const [locating, setLocating] = useState(false);

  const hasSavedPin =
    typeof initialLatitude === 'number' &&
    typeof initialLongitude === 'number' &&
    Number.isFinite(initialLatitude) &&
    Number.isFinite(initialLongitude);

  const startCenter: LngLat = hasSavedPin
    ? [initialLongitude, initialLatitude]
    : INDIA_CENTER;
  const startZoom = hasSavedPin ? 16 : 4.5;

  useEffect(() => {
    if (!visible) {
      pendingCenterRef.current = null;
      return;
    }

    centerRef.current = startCenter;

    if (hasSavedPin) {
      pendingCenterRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const permission = await Location.getForegroundPermissionsAsync();

      if (!permission.granted || cancelled) {
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();

      if (!lastKnown || cancelled) {
        return;
      }

      const next: LngLat = [lastKnown.coords.longitude, lastKnown.coords.latitude];
      centerRef.current = next;
      pendingCenterRef.current = next;
      cameraRef.current?.easeTo({ center: next, zoom: 15, duration: 700 });
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, hasSavedPin, initialLatitude, initialLongitude]);

  const moveCamera = (center: LngLat, zoom: number) => {
    centerRef.current = center;
    cameraRef.current?.easeTo({ center, zoom, duration: 500 });
  };

  const handleMyLocation = async () => {
    if (locating) {
      return;
    }

    setLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Location access needed',
          'Allow location access to center the map on you. You can still move the map by hand.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      moveCamera([position.coords.longitude, position.coords.latitude], 16);
    } catch (error) {
      Alert.alert(
        'Location unavailable',
        error instanceof Error ? error.message : 'Unable to read your current location.'
      );
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = async () => {
    const center = (await mapRef.current?.getCenter()) ?? centerRef.current;
    onConfirm({
      longitude: center[0],
      latitude: center[1],
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: colors.background,
              borderBottomColor: colors['outline-variant'],
            },
          ]}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Close map">
            <Ionicons name="arrow-back" size={22} color={colors['on-background']} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[Typography.title, { color: colors['on-background'] }]}>Select location</Text>
            <Text style={[Typography.caption, { color: colors['on-surface-variant'] }]}>
              Move the map so the pin sits on your showroom
            </Text>
          </View>
        </View>

        <View style={styles.mapWrap}>
          <Map
            ref={mapRef}
            style={styles.map}
            mapStyle={MAP_STYLE_URL}
            androidView="texture"
            compass
            logo
            attribution
            attributionPosition={{ bottom: 8, right: 8 }}
            onDidFinishLoadingMap={() => {
              const pending = pendingCenterRef.current;

              if (pending) {
                cameraRef.current?.easeTo({ center: pending, zoom: 15, duration: 700 });
              }
            }}
            onPress={(event) => {
              const lngLat = event.nativeEvent.lngLat;
              moveCamera(lngLat, 16);
            }}
            onRegionDidChange={(event) => {
              centerRef.current = event.nativeEvent.center;
            }}>
            <Camera
              ref={cameraRef}
              initialViewState={{ center: startCenter, zoom: startZoom }}
              minZoom={3}
              maxZoom={18}
            />
          </Map>

          <View pointerEvents="none" style={styles.pin}>
            <Ionicons name="location" size={42} color={colors.primary} />
          </View>

          <Pressable
            onPress={handleMyLocation}
            disabled={locating}
            style={({ pressed }) => [
              styles.myLocation,
              {
                backgroundColor: colors['surface-container-lowest'],
                opacity: pressed || locating ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Center on my location">
            {locating ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="navigate" size={22} color={colors.primary} />
            )}
          </Pressable>
        </View>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: colors.background,
              borderTopColor: colors['outline-variant'],
            },
          ]}>
          <Button label="Use this location" onPress={handleConfirm} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  pin: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -21 }],
  },
  myLocation: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
