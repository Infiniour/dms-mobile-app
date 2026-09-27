import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTabDataFetch } from '@/hooks/useTabDataFetch';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Grid } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { PERMISSIONS, usePermissions } from '@/permissions';
import { getProfile, listVehicles } from '@/services';
import { syncShowroomFromProfile } from '@/utils/showroom';
import { useAuthStore } from '@/store';
import { categoryToApiGroupKey, mapApiVehicleToItem, type ApiVehicleListing } from './apiMapper';
import { InventoryHeader } from './components/InventoryHeader';
import { VehicleCard } from './components/VehicleCard';
import { VehicleCardCompact } from './components/VehicleCardCompact';
import { VehicleCardSkeleton, VehicleCardCompactSkeleton } from './components/VehicleCardSkeleton';
import { VehicleCategoryTabs } from './components/VehicleCategoryTabs';
import { VehicleSearchBar } from './components/VehicleSearchBar';
import type { VehicleCategory, VehicleFilter, VehicleItem } from './types';

type ViewMode = 'card' | 'compact';

const LISTING_LIMIT = 100;
const emptyGroup = { total: 0, page: 1, limit: LISTING_LIMIT, vehicles: [] };

type ShowroomRole = { showroom_id: number; role?: string | null };
type ProfileData = { showroom_roles?: ShowroomRole[] | null };

export function VehiclesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { can } = usePermissions();
  const { width: screenWidth } = useWindowDimensions();
  // Read imperatively rather than subscribing: the focus effect below *sets*
  // this value, and subscribing made the effect's identity change mid-load,
  // which re-ran the whole fetch a second time on every first visit.
  const primaryShowroomIdRef = useRef(useAuthStore.getState().primaryShowroomId);
  const [selectedFilter, setSelectedFilter] = useState<VehicleFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listing, setListing] = useState<ApiVehicleListing | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;

  const { isLoading } = useTabDataFetch({
    onFocus: async ({ isCancelled }) => {
      setErrorMessage('');

      const knownShowroomId = primaryShowroomIdRef.current;
      const resolveShowroomId = knownShowroomId
        ? Promise.resolve(knownShowroomId)
        : getProfile().then((profileResponse) => {
            const profileData =
              (profileResponse as unknown as { data?: ProfileData })?.data ??
              (profileResponse as unknown as ProfileData);
            // Goes through the shared sync so the role lands with the id;
            // setting the id alone would leave the two able to disagree.
            const resolvedId = syncShowroomFromProfile(profileData)?.showroom_id;

            if (resolvedId) {
              primaryShowroomIdRef.current = resolvedId;
            }

            return resolvedId;
          });

      try {
        const showroomId = await resolveShowroomId;
        if (!showroomId) {
          throw new Error('No showroom found for this account yet.');
        }

        const response = await listVehicles({ showroomId, limit: LISTING_LIMIT });
        if (isCancelled()) {
          return;
        }

        const responseData = response as unknown as { data?: ApiVehicleListing };
        const data = responseData?.data ?? (responseData as unknown as ApiVehicleListing);
        setListing(data ?? null);
      } catch (error) {
        if (isCancelled()) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load vehicles.');
      }
    },
  });

  const groups = listing ?? { cars: emptyGroup, bikes: emptyGroup, scooties: emptyGroup };
  const totalVehicleCount = groups.cars.total + groups.bikes.total + groups.scooties.total;

  const categoryTabs = useMemo(
    () => [
      { value: 'All' as const, label: 'All', count: totalVehicleCount, icon: 'dna' as const },
      { value: 'Cars' as const, label: 'Cars', count: groups.cars.total, icon: 'car-sports' as const },
      { value: 'Bikes' as const, label: 'Bikes', count: groups.bikes.total, icon: 'motorbike' as const },
      { value: 'Scooty' as const, label: 'Scooty', count: groups.scooties.total, icon: 'scooter' as const },
    ] as const,
    [groups, totalVehicleCount]
  );

  const selectedFilterVehicles = useMemo<VehicleItem[]>(() => {
    if (selectedFilter === 'All') {
      return [
        ...groups.cars.vehicles.map(mapApiVehicleToItem),
        ...groups.bikes.vehicles.map(mapApiVehicleToItem),
        ...groups.scooties.vehicles.map(mapApiVehicleToItem),
      ];
    }
    return groups[categoryToApiGroupKey(selectedFilter as VehicleCategory)].vehicles.map(mapApiVehicleToItem);
  }, [groups, selectedFilter]);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (query.length === 0) {
      return selectedFilterVehicles;
    }

    return selectedFilterVehicles.filter((vehicle) =>
      [vehicle.name, vehicle.registration, vehicle.meta, vehicle.status]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [searchQuery, selectedFilterVehicles]);

  const openVehicle = useCallback(
    (id: string) => router.push({ pathname: '/vehicle/[id]', params: { id } }),
    [router]
  );

  const renderVehicle = useCallback(
    ({ item }: { item: VehicleItem }) =>
      viewMode === 'compact' ? (
        <VehicleCardCompact vehicle={item} onPress={openVehicle} />
      ) : (
        <VehicleCard vehicle={item} onPress={openVehicle} />
      ),
    [openVehicle, viewMode]
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <InventoryHeader
          totalCount={totalVehicleCount}
          onAddPress={() => router.push('/vehicle/add')}
          canAdd={can(PERMISSIONS.VEHICLE_CREATE)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <VehicleSearchBar value={searchQuery} onChangeText={setSearchQuery} loading={isLoading} />
        <VehicleCategoryTabs
          tabs={categoryTabs}
          selectedCategory={selectedFilter === 'All' ? undefined : (selectedFilter as VehicleCategory)}
          onSelect={setSelectedFilter}
          loading={isLoading}
        />
      </View>

      {errorMessage ? (
        <Text style={[styles.errorText, { color: colors.error, paddingHorizontal: horizontalPadding }]}>
          {errorMessage}
        </Text>
      ) : null}

      <FlatList
        style={styles.scroll}
        data={isLoading ? Array(8).fill(null) : filteredVehicles}
        keyExtractor={(item, index) => (item ? keyExtractor(item) : `skeleton-${index}`)}
        renderItem={({ item }) =>
          isLoading ? (
            viewMode === 'compact' ? (
              <VehicleCardCompactSkeleton />
            ) : (
              <VehicleCardSkeleton />
            )
          ) : (
            renderVehicle({ item: item as VehicleItem })
          )
        }
        ListHeaderComponent={null}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        ItemSeparatorComponent={() => (
          <View style={{ height: viewMode === 'compact' ? 8 : 12 }} />
        )}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        scrollEnabled={!isLoading}
      />

    </SafeAreaView>
  );
}

function keyExtractor(vehicle: VehicleItem) {
  return vehicle.id;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 29,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  errorText: {
    ...Typography.caption,
    marginTop: 8,
  },
});
