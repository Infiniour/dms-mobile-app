import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTabDataFetch } from '@/hooks/useTabDataFetch';
import { PERMISSIONS, usePermissions } from '@/permissions';
import { listVehicles } from '@/services';
import { resolvePrimaryShowroomId } from '@/utils/showroom';
import { SkeletonBox } from '@/components/ui';
import {
  mapApiVehicleToItem,
  type ApiVehicle,
  type ApiVehicleListing,
} from '@/views/vehicles/apiMapper';
import { VehicleSearchBar } from '@/views/vehicles/components/VehicleSearchBar';
import { SaleVehicleRow } from './components/SaleVehicleRow';
import { SalesStatCard } from './components/SalesStatCard';
import type { SaleVehicle } from './types';

const LISTING_LIMIT = 100;

// Only these two statuses belong on a sales screen: a car still in the garage
// or under inspection is not something a salesperson can close today.
const SALES_STATUSES = ['ready_for_sale', 'sold'];

export function SalesPanelScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { can } = usePermissions();
  const { width: screenWidth } = useWindowDimensions();
  const [vehicles, setVehicles] = useState<SaleVehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;
  const canSell = can(PERMISSIONS.SALE_CREATE);

  const { isLoading } = useTabDataFetch({
    onFocus: async ({ isCancelled }) => {
      setErrorMessage('');

      try {
        const showroomId = await resolvePrimaryShowroomId();

        if (!showroomId) {
          throw new Error('No showroom found for this account yet.');
        }

        const response = await listVehicles({
          showroomId,
          status: SALES_STATUSES,
          limit: LISTING_LIMIT,
        });
        if (isCancelled()) {
          return;
        }

        const responseData = response as unknown as { data?: ApiVehicleListing };
        const data = responseData?.data ?? (responseData as unknown as ApiVehicleListing);

        setVehicles(toSaleVehicles(data));
      } catch (error) {
        if (isCancelled()) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load vehicles.');
      }
    },
  });

  const forSaleCount = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status !== 'Sold').length,
    [vehicles]
  );

  const soldTodayCount = useMemo(
    () => vehicles.filter((vehicle) => isToday(vehicle.soldAt)).length,
    [vehicles]
  );

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (query.length === 0) {
      return vehicles;
    }

    return vehicles.filter((vehicle) =>
      [vehicle.name, vehicle.registration, vehicle.meta]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [searchQuery, vehicles]);

  const openVehicle = useCallback(
    (id: string) => router.push({ pathname: '/vehicle/[id]', params: { id } }),
    [router]
  );

  const openSell = useCallback(
    (id: string) => {
      const vehicle = vehicles.find((item) => item.id === id);

      router.push({
        pathname: '/vehicle/sell/[id]',
        // Carried along so the sale form can name the vehicle and prefill the
        // asking price without a second fetch before the user can type.
        params: {
          id,
          name: vehicle?.name ?? '',
          registration: vehicle?.registration ?? '',
        },
      });
    },
    [router, vehicles]
  );

  const renderItem = useCallback(
    ({ item }: { item: SaleVehicle }) => (
      <SaleVehicleRow
        vehicle={item}
        onOpen={openVehicle}
        onSell={canSell && item.status !== 'Sold' ? openSell : undefined}
      />
    ),
    [canSell, openSell, openVehicle]
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.title, { color: colors['on-surface'] }]}>Sales Panel</Text>
        <Text style={[styles.subtitle, { color: colors['on-surface-variant'] }]}>
          Select a vehicle to start a sale
        </Text>

        <VehicleSearchBar value={searchQuery} onChangeText={setSearchQuery} loading={isLoading} />

        <View style={styles.statsRow}>
          <SalesStatCard value={forSaleCount} label="For Sale" loading={isLoading} />
          <SalesStatCard value={soldTodayCount} label="Sold Today" loading={isLoading} />
        </View>
      </View>

      {errorMessage ? (
        <Text
          style={[styles.errorText, { color: colors.error, paddingHorizontal: horizontalPadding }]}>
          {errorMessage}
        </Text>
      ) : null}

      <FlatList
        style={styles.list}
        data={isLoading ? EMPTY_SKELETON_ROWS : filteredVehicles}
        keyExtractor={(item, index) => (item ? item.id : `skeleton-${index}`)}
        renderItem={({ item }) =>
          isLoading ? <SaleRowSkeleton /> : renderItem({ item: item as SaleVehicle })
        }
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading || errorMessage ? null : (
            <Text style={[styles.empty, { color: colors['on-surface-variant'] }]}>
              {searchQuery.trim()
                ? 'No vehicles match that search.'
                : 'Nothing is ready for sale yet. Move a vehicle to "Ready for sale" to see it here.'}
            </Text>
          )
        }
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

const EMPTY_SKELETON_ROWS = Array(6).fill(null) as (SaleVehicle | null)[];

function SaleRowSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.skeletonRow, { borderColor: colors['outline-variant'] }]}>
      <SkeletonBox width={44} height={44} borderRadius={12} />
      <View style={styles.skeletonText}>
        <SkeletonBox width="60%" height={14} />
        <SkeletonBox width="40%" height={11} />
      </View>
      <SkeletonBox width={58} height={30} borderRadius={10} />
    </View>
  );
}

/**
 * Flattens the grouped listing into one list ordered the way a salesperson
 * works: everything still sellable first, then today's closed sales as a
 * record of the day, then older ones.
 */
function toSaleVehicles(listing: ApiVehicleListing | null | undefined): SaleVehicle[] {
  if (!listing) {
    return [];
  }

  const all = [
    ...(listing.cars?.vehicles ?? []),
    ...(listing.bikes?.vehicles ?? []),
    ...(listing.scooties?.vehicles ?? []),
  ];

  return all.map(toSaleVehicle).sort(compareSaleVehicles);
}

function toSaleVehicle(vehicle: ApiVehicle): SaleVehicle {
  const item = mapApiVehicleToItem(vehicle);
  const status = vehicle.current_status;

  return {
    ...item,
    soldAt: status?.status === 'sold' ? status.started_at : undefined,
  };
}

function compareSaleVehicles(a: SaleVehicle, b: SaleVehicle) {
  const aSold = a.status === 'Sold';
  const bSold = b.status === 'Sold';

  if (aSold !== bSold) {
    return aSold ? 1 : -1;
  }

  if (aSold && bSold) {
    return toTimestamp(b.soldAt) - toTimestamp(a.soldAt);
  }

  return a.name.localeCompare(b.name);
}

function toTimestamp(value?: string) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function isToday(value?: string) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 29,
  },
  title: {
    ...Typography.hero,
    fontSize: 26,
    includeFontPadding: false,
  },
  subtitle: {
    ...Typography.body,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Grid.columns.gutter,
    marginTop: 18,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  errorText: {
    ...Typography.caption,
    marginTop: 8,
  },
  empty: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  skeletonText: {
    flex: 1,
    gap: 8,
  },
});
