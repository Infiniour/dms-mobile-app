import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet, CameraCaptureModal } from '@/components/ui';
import { FontFamily, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

// Matches the upload API's documented `label` enum exactly
// (front | interior | exterior | back | wheel) — any value outside this set
// is rejected by the backend, so this is the full set of valid slots.
export type PhotoLabel = 'front' | 'back' | 'interior' | 'exterior' | 'wheel';

export const PHOTO_LABELS: { value: PhotoLabel; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'wheel', label: 'Wheel' },
];

const MAX_PHOTOS_PER_LABEL = 2;

export type VehiclePhoto = {
  uri: string;
  name?: string | null;
  type?: string | null;
  label: PhotoLabel;
};

export type ExistingVehiclePhoto = {
  id: number;
  url: string;
  /** Section key as returned by the API. Anything outside PHOTO_LABELS still counts but has no slot of its own. */
  label: string;
};

// Discriminated by a tag rather than by inspecting `id`/`uri` on the union —
// avoids a TS quirk where a type derived from `arr[0] ?? arr2[0]` (without
// noUncheckedIndexedAccess) collapses to just the first array's element type,
// silently dropping the second from the union.
type SlotEntry =
  | { kind: 'existing'; uri: string; id: number; source: ExistingVehiclePhoto }
  | { kind: 'new'; uri: string; source: VehiclePhoto };

type VehiclePhotosPickerProps = {
  photos: VehiclePhoto[];
  onChange: (photos: VehiclePhoto[]) => void;
  /** Already-uploaded photos, shown ahead of newly staged ones (e.g. when editing a vehicle). */
  existingPhotos?: ExistingVehiclePhoto[];
  onRemoveExisting?: (photo: ExistingVehiclePhoto) => void;
  /** id of an existing photo currently being deleted, so its tile can show as busy. */
  removingExistingId?: number | null;
};

const TILE_SIZE = 60;
const MANAGE_TILE_SIZE = 72;

export function VehiclePhotosPicker({
  photos,
  onChange,
  existingPhotos = [],
  onRemoveExisting,
  removingExistingId,
}: VehiclePhotosPickerProps) {
  const { colors } = useTheme();
  const [activeLabel, setActiveLabel] = useState<PhotoLabel | null>(null);
  // 'manage' lists what's already in the slot with remove controls; 'source'
  // is the take-photo/choose-from-library step. A slot with photos opens on
  // 'manage' so a second tap doesn't just re-launch the camera on top of what's there.
  const [sheetMode, setSheetMode] = useState<'manage' | 'source'>('source');
  const [cameraLabel, setCameraLabel] = useState<PhotoLabel | null>(null);

  const getSlotEntries = (label: PhotoLabel): SlotEntry[] => [
    ...existingPhotos
      .filter((photo) => photo.label === label)
      .map((photo): SlotEntry => ({ kind: 'existing', uri: photo.url, id: photo.id, source: photo })),
    ...photos
      .filter((photo) => photo.label === label)
      .map((photo): SlotEntry => ({ kind: 'new', uri: photo.uri, source: photo })),
  ];

  const openSlot = (label: PhotoLabel) => {
    setActiveLabel(label);
    setSheetMode(getSlotEntries(label).length > 0 ? 'manage' : 'source');
  };

  const addPhoto = (
    asset: { uri: string; fileName?: string | null; mimeType?: string | null },
    label: PhotoLabel
  ) => {
    onChange([...photos, { uri: asset.uri, name: asset.fileName, type: asset.mimeType, label }]);
  };

  const removePhoto = (photo: VehiclePhoto) => {
    onChange(photos.filter((current) => current !== photo));
  };

  const handleTakePhoto = (label: PhotoLabel) => {
    setCameraLabel(label);
  };

  const handleChooseFromLibrary = async (label: PhotoLabel, remainingSlots: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Please allow photo access to select vehicle photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: remainingSlots > 1,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled) {
      result.assets.slice(0, remainingSlots).forEach((asset) => addPhoto(asset, label));
    }
  };

  const activeLabelInfo = PHOTO_LABELS.find((entry) => entry.value === activeLabel);
  const activeSlotEntries = activeLabel ? getSlotEntries(activeLabel) : [];
  const activeRemainingSlots = MAX_PHOTOS_PER_LABEL - activeSlotEntries.length;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}>
        {PHOTO_LABELS.map((section) => {
          const slotEntries = getSlotEntries(section.value);
          const cover = slotEntries[0];
          const isCoverBusy = cover?.kind === 'existing' && removingExistingId === cover.id;

          return (
            <View key={section.value} style={styles.slot}>
              <Pressable
                onPress={() => openSlot(section.value)}
                style={[
                  styles.tile,
                  {
                    borderColor: colors.primary,
                    borderStyle: cover ? 'solid' : 'dashed',
                    backgroundColor: colors['surface-container-low'],
                    opacity: isCoverBusy ? 0.5 : 1,
                  },
                ]}>
                {cover ? (
                  <Image source={{ uri: cover.uri }} style={styles.image} />
                ) : (
                  <Ionicons name="add" size={20} color={colors.primary} />
                )}
              </Pressable>

              {slotEntries.length > 1 ? (
                <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.countBadgeText, { color: colors['on-primary'] }]}>
                    +{slotEntries.length - 1}
                  </Text>
                </View>
              ) : null}

              <Text
                style={[Typography.caption, styles.slotLabel, { color: colors['on-surface-variant'] }]}
                numberOfLines={1}>
                {section.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <BottomSheet visible={activeLabel !== null} onClose={() => setActiveLabel(null)}>
        {sheetMode === 'manage' && activeLabel ? (
          <>
            <Text style={[Typography.title, styles.sheetTitle, { color: colors['on-background'] }]}>
              {activeLabelInfo?.label} photos
            </Text>

            <View style={styles.manageRow}>
              {activeSlotEntries.map((entry) => {
                const key = entry.kind === 'existing' ? `existing-${entry.id}` : entry.uri;
                const isBusy = entry.kind === 'existing' && removingExistingId === entry.id;

                return (
                  <View key={key} style={[styles.manageTile, isBusy && styles.tileBusy]}>
                    <Image source={{ uri: entry.uri }} style={styles.image} />
                    <Pressable
                      onPress={() =>
                        entry.kind === 'existing'
                          ? onRemoveExisting?.(entry.source)
                          : removePhoto(entry.source)
                      }
                      disabled={isBusy}
                      hitSlop={6}
                      style={[styles.removeBadge, { backgroundColor: colors.error }]}>
                      <Ionicons name="close" size={12} color={colors['on-error']} />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {activeRemainingSlots > 0 ? (
              <Pressable
                onPress={() => setSheetMode('source')}
                style={({ pressed }) => [
                  styles.sheetOption,
                  styles.addMoreOption,
                  {
                    backgroundColor: colors['surface-container-low'],
                    borderColor: colors['outline-variant'],
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <View style={[styles.sheetOptionIcon, { backgroundColor: colors['surface-container'] }]}>
                  <Ionicons name="add" size={22} color={colors.primary} />
                </View>
                <Text style={[Typography.body, styles.sheetOptionLabel, { color: colors['on-surface'] }]}>
                  Add another photo
                </Text>
              </Pressable>
            ) : (
              <Text
                style={[
                  Typography.caption,
                  styles.limitNote,
                  { color: colors['on-surface-variant'] },
                ]}>
                Up to {MAX_PHOTOS_PER_LABEL} photos per angle
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={[Typography.title, styles.sheetTitle, { color: colors['on-background'] }]}>
              Add {activeLabelInfo?.label.toLowerCase()} photo
            </Text>

            <View style={styles.sheetOptions}>
              {[
                {
                  key: 'camera',
                  icon: 'camera-outline' as const,
                  label: 'Take photo',
                  onPress: () => activeLabel && handleTakePhoto(activeLabel),
                },
                {
                  key: 'library',
                  icon: 'images-outline' as const,
                  label: 'Choose from library',
                  onPress: () =>
                    activeLabel && handleChooseFromLibrary(activeLabel, activeRemainingSlots),
                },
              ].map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    setActiveLabel(null);
                    option.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.sheetOption,
                    {
                      backgroundColor: colors['surface-container-low'],
                      borderColor: colors['outline-variant'],
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <View style={[styles.sheetOptionIcon, { backgroundColor: colors['surface-container'] }]}>
                    <Ionicons name={option.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={[Typography.body, styles.sheetOptionLabel, { color: colors['on-surface'] }]}>
                    {option.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors['on-surface-variant']} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </BottomSheet>

      <CameraCaptureModal
        visible={cameraLabel !== null}
        onClose={() => setCameraLabel(null)}
        onCapture={(photo) => {
          if (cameraLabel) {
            addPhoto(photo, cameraLabel);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: 16,
    paddingRight: 4,
  },
  slot: {
    alignItems: 'center',
    width: TILE_SIZE + 8,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 16,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tileBusy: {
    opacity: 0.5,
  },
  removeBadge: {
    position: 'absolute',
    // Positive offsets keep this inside the tile's bounds — the tile has
    // overflow:hidden to round the image's corners, which was slicing this
    // circle into a crescent when it sat partly outside (negative offsets).
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    bottom: 18,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: FontFamily.medium,
  },
  slotLabel: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 13,
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  manageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  manageTile: {
    width: MANAGE_TILE_SIZE,
    height: MANAGE_TILE_SIZE,
    borderRadius: 18,
    overflow: 'hidden',
  },
  addMoreOption: {
    marginBottom: 4,
  },
  limitNote: {
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetOptions: {
    gap: 12,
  },
  sheetOption: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sheetOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionLabel: {
    flex: 1,
  },
});
