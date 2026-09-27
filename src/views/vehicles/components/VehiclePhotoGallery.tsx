import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { VehiclePhotoItem } from '../types';
import { PHOTO_LABELS } from './VehiclePhotosPicker';

type VehiclePhotoGalleryProps = {
  photos: VehiclePhotoItem[];
  fallbackIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

function formatPhotoLabel(label: string) {
  const known = PHOTO_LABELS.find((entry) => entry.value === label);
  if (known) {
    return known.label;
  }

  return label
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Detail-page photo strip + fullscreen pager.
 *
 * Photos are ordered by section (front/back/…). A section can hold more than
 * one image — the caption and fullscreen header show "Front · 2 of 2" so the
 * second shot is obvious, and every thumb is reachable by scrolling (no dead +N).
 */
export function VehiclePhotoGallery({ photos, fallbackIcon }: VehiclePhotoGalleryProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerListRef = useRef<FlatList<VehiclePhotoItem>>(null);
  const screenWidth = Dimensions.get('window').width;

  const safeIndex = photos.length === 0 ? 0 : Math.min(selectedIndex, photos.length - 1);
  const selected = photos[safeIndex];
  const heroBackground = isDark ? colors['surface-container-high'] : colors['surface-container'];

  const labelMeta = useMemo(() => {
    if (!selected) {
      return null;
    }

    const sameLabel = photos.filter((photo) => photo.label === selected.label);
    const position = sameLabel.findIndex((photo) => photo.url === selected.url) + 1;

    return {
      title: formatPhotoLabel(selected.label),
      position,
      total: sameLabel.length,
    };
  }, [photos, selected]);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const onViewerScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (next >= 0 && next < photos.length) {
      setViewerIndex(next);
      setSelectedIndex(next);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (typeof first?.index === 'number') {
      setViewerIndex(first.index);
      setSelectedIndex(first.index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const renderViewerItem = useCallback(
    ({ item }: ListRenderItemInfo<VehiclePhotoItem>) => (
      <View style={[styles.viewerPage, { width: screenWidth }]}>
        <Image
          source={{ uri: item.url }}
          style={styles.viewerImage}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
    ),
    [screenWidth]
  );

  if (photos.length === 0) {
    return (
      <View style={[styles.heroCard, { backgroundColor: heroBackground }]}>
        <MaterialCommunityIcons name={fallbackIcon} size={96} color={colors['on-surface-variant']} />
      </View>
    );
  }

  const viewerLabel = photos[viewerIndex]
    ? formatPhotoLabel(photos[viewerIndex].label)
    : '';
  const viewerSame = photos.filter((photo) => photo.label === photos[viewerIndex]?.label);
  const viewerPosition =
    viewerSame.findIndex((photo) => photo.url === photos[viewerIndex]?.url) + 1;

  return (
    <>
      <Pressable
        onPress={() => openViewer(safeIndex)}
        style={[styles.heroCard, { backgroundColor: heroBackground }]}
        accessibilityRole="imagebutton"
        accessibilityLabel="Open photo gallery">
        <Image
          source={{ uri: selected.url }}
          style={styles.heroImage}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={selected.url}
        />
        {labelMeta ? (
          <View style={[styles.heroBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <Text style={styles.heroBadgeText}>
              {labelMeta.title}
              {labelMeta.total > 1 ? ` · ${labelMeta.position} of ${labelMeta.total}` : ''}
            </Text>
            <Ionicons name="expand-outline" size={14} color="#fff" />
          </View>
        ) : null}
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbRow}
        style={styles.thumbScroll}>
        {photos.map((photo, index) => {
          const active = index === safeIndex;
          const countForLabel = photos.filter((entry) => entry.label === photo.label).length;
          const orderInLabel =
            photos
              .filter((entry) => entry.label === photo.label)
              .findIndex((entry) => entry.url === photo.url) + 1;

          return (
            <Pressable
              key={`${photo.label}-${photo.id ?? photo.url}-${index}`}
              onPress={() => setSelectedIndex(index)}
              onLongPress={() => openViewer(index)}
              style={[
                styles.thumb,
                {
                  borderColor: active ? colors.primary : colors['outline-variant'],
                  borderWidth: active ? 2 : 1,
                  opacity: active ? 1 : 0.72,
                },
              ]}>
              <Image
                source={{ uri: photo.url }}
                style={styles.thumbImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <View style={[styles.thumbCaption, { backgroundColor: colors.background }]}>
                <Text
                  style={[styles.thumbCaptionText, { color: colors['on-surface'] }]}
                  numberOfLines={1}>
                  {formatPhotoLabel(photo.label)}
                  {countForLabel > 1 ? ` ${orderInLabel}/${countForLabel}` : ''}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal
        visible={viewerOpen}
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
        statusBarTranslucent>
        <View style={[styles.viewer, { backgroundColor: '#000', paddingTop: insets.top }]}>
          <View style={styles.viewerTop}>
            <Pressable
              onPress={() => setViewerOpen(false)}
              hitSlop={12}
              style={styles.viewerClose}
              accessibilityRole="button"
              accessibilityLabel="Close gallery">
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {viewerLabel}
              {viewerSame.length > 1 ? ` · ${viewerPosition} of ${viewerSame.length}` : ''}
            </Text>
            <Text style={styles.viewerCounter}>
              {viewerIndex + 1}/{photos.length}
            </Text>
          </View>

          <FlatList
            ref={viewerListRef}
            data={photos}
            keyExtractor={(item, index) => `${item.label}-${item.id ?? item.url}-${index}`}
            horizontal
            pagingEnabled
            initialScrollIndex={viewerIndex}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={onViewerScrollEnd}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            showsHorizontalScrollIndicator={false}
            renderItem={renderViewerItem}
          />

          <View style={[styles.viewerBottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.viewerDots}>
              {photos.map((photo, index) => (
                <Pressable
                  key={`dot-${photo.url}-${index}`}
                  onPress={() => {
                    viewerListRef.current?.scrollToIndex({ index, animated: true });
                    setViewerIndex(index);
                    setSelectedIndex(index);
                  }}
                  style={[
                    styles.viewerDot,
                    {
                      borderColor: index === viewerIndex ? '#fff' : 'transparent',
                      opacity: index === viewerIndex ? 1 : 0.55,
                    },
                  ]}>
                  <Image source={{ uri: photo.url }} style={styles.viewerDotImage} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: 220,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    color: '#fff',
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  thumbScroll: {
    marginTop: 12,
  },
  thumbRow: {
    gap: 10,
    paddingRight: 4,
  },
  thumb: {
    width: 88,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#00000010',
  },
  thumbImage: {
    width: '100%',
    height: 64,
  },
  thumbCaption: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  thumbCaptionText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
  },
  viewer: {
    flex: 1,
  },
  viewerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  viewerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  viewerTitle: {
    flex: 1,
    color: '#fff',
    fontFamily: FontFamily.medium,
    fontSize: 15,
  },
  viewerCounter: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  viewerPage: {
    flex: 1,
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerBottom: {
    paddingTop: 8,
  },
  viewerDots: {
    gap: 8,
    paddingHorizontal: 16,
  },
  viewerDot: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
  },
  viewerDotImage: {
    width: '100%',
    height: '100%',
  },
});
