import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Grid } from '@/constants/theme';
import { getDashboard } from '@/services';
import { useAuthStore } from '@/store';
import { resolvePrimaryShowroomId } from '@/utils/showroom';
import { useTabDataFetch } from '@/hooks/useTabDataFetch';
import { ScreenTopArea } from '@/components/ui';
import { MetricCard } from './components/MetricCard';
import { MetricGrid } from './components/MetricGrid';
import { RangeFilter } from './components/RangeFilter';
import { TopCategories } from './components/TopCategories';
import {
  expenseMetricShells,
  inventoryMetricShells,
  summaryMetricShells,
  timeRanges,
} from './data';
import type { CategoryStat, MetricStat, TimeRange } from './types';

type DashboardData = {
  sales_summary?: {
    vehicles_sold?: number;
    total_revenue?: number;
    net_profit?: number;
    average_profit_per_sale?: number;
  };
  inventory_summary?: {
    inventory_count?: number;
    inventory_value?: number;
    dead_stock_count?: number;
    average_inventory_age_days?: number;
  };
  expense_summary?: {
    total_expenses?: number;
    average_expense_per_vehicle?: number;
  };
  top_vehicle_types?: Array<{
    vehicle_type?: string;
    vehicles_sold?: number;
    net_profit?: number;
  }>;
};
type DashboardResponse = {
  data?: DashboardData;
};

export function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const fullName = useAuthStore((s) => s.fullName);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1W');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const firstName = fullName.trim().split(' ')[0] || 'there';
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;
  const cardGap = screenWidth < 360 ? 12 : Grid.columns.gutter;
  const contentWidth = screenWidth - horizontalPadding * 2;
  const compactCardWidth = (contentWidth - cardGap) / 2;
  const dashboardMetrics = useMemo(
    () => getDashboardMetrics(dashboardData),
    [dashboardData]
  );

  const { isLoading: isDashboardLoading } = useTabDataFetch({
    onFocus: async ({ isCancelled }) => {
      const showroomId = await resolvePrimaryShowroomId();

      const response = await getDashboard({
        duration: toDashboardDuration(selectedRange),
        showroomId,
      });
      const data = (response as unknown as DashboardResponse).data;

      if (isCancelled()) {
        return;
      }

      if (__DEV__) {
        console.log('Dashboard response', response);
      }

      if (data) {
        setDashboardData(data);
      }
    },
    dependencies: [selectedRange],
  });

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top']}>
      <View style={[styles.fixedHeader, { paddingHorizontal: horizontalPadding }]}>
        <ScreenTopArea
          title="AutoDeals"
          eyebrow="Main Showroom"
          greeting={`Good morning,\n${firstName}`}
          subtitle="Performance overview for your dealership"
          onNotificationPress={() => router.push('/notifications')}
        />
        <RangeFilter
          ranges={timeRanges}
          selectedRange={selectedRange}
          onSelectRange={setSelectedRange}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        <MetricCard {...dashboardMetrics.summary[0]} loading={isDashboardLoading} />
        <MetricGrid
          metrics={dashboardMetrics.summary.slice(1, 3)}
          cardWidth={compactCardWidth}
          gap={cardGap}
          loading={isDashboardLoading}
        />
        <MetricCard {...dashboardMetrics.summary[3]} loading={isDashboardLoading} />

        <MetricGrid
          metrics={dashboardMetrics.inventory}
          cardWidth={compactCardWidth}
          gap={cardGap}
          loading={isDashboardLoading}
        />

        {dashboardMetrics.expenses.map((metric) => (
          <MetricCard key={metric.title} {...metric} loading={isDashboardLoading} />
        ))}

        <TopCategories categories={dashboardMetrics.categories} loading={isDashboardLoading} />
      </ScrollView>
    </SafeAreaView>
  );
}

type DashboardDuration = '1w' | '1m' | '3m' | '6m' | '12m' | 'lifetime';

function toDashboardDuration(range: TimeRange): DashboardDuration {
  const map: Record<TimeRange, DashboardDuration> = {
    '1W': '1w',
    '1M': '1m',
    '3M': '3m',
    '6M': '6m',
    '12M': '12m',
    Lifetime: 'lifetime',
  };

  return map[range];
}

function getDashboardMetrics(data: DashboardData | null): {
  summary: MetricStat[];
  inventory: MetricStat[];
  expenses: MetricStat[];
  categories: CategoryStat[];
} {
  // No API payload yet: keep card shells with empty values so loading skeletons
  // (or blank cards) never flash fake demo numbers / trends.
  if (!data) {
    return {
      summary: summaryMetricShells.map((shell) => ({ ...shell, value: '' })),
      inventory: inventoryMetricShells.map((shell) => ({ ...shell, value: '' })),
      expenses: expenseMetricShells.map((shell) => ({ ...shell, value: '' })),
      categories: [],
    };
  }

  return {
    summary: [
      {
        ...summaryMetricShells[0],
        value: formatCurrency(data.sales_summary?.net_profit),
      },
      {
        ...summaryMetricShells[1],
        value: formatNumber(data.sales_summary?.vehicles_sold),
      },
      {
        ...summaryMetricShells[2],
        value: formatShortCurrency(data.sales_summary?.average_profit_per_sale),
      },
      {
        ...summaryMetricShells[3],
        value: formatCurrency(data.sales_summary?.total_revenue),
      },
    ],
    inventory: [
      {
        ...inventoryMetricShells[0],
        value: formatNumber(data.inventory_summary?.inventory_count),
      },
      {
        ...inventoryMetricShells[1],
        value: formatShortCurrency(data.inventory_summary?.inventory_value),
      },
      {
        ...inventoryMetricShells[2],
        value: formatNumber(data.inventory_summary?.dead_stock_count),
      },
      {
        ...inventoryMetricShells[3],
        value: formatNumber(data.inventory_summary?.average_inventory_age_days),
      },
    ],
    expenses: [
      {
        ...expenseMetricShells[0],
        value: formatCurrency(data.expense_summary?.total_expenses),
      },
      {
        ...expenseMetricShells[1],
        value: formatCurrency(data.expense_summary?.average_expense_per_vehicle),
      },
    ],
    categories:
      data.top_vehicle_types?.map((category) => ({
        icon: getVehicleTypeIcon(category.vehicle_type),
        name: formatVehicleType(category.vehicle_type),
        sold: `${formatNumber(category.vehicles_sold)} Sold`,
        amount: formatCurrency(category.net_profit),
      })) ?? [],
  };
}

function formatNumber(value?: number) {
  if (typeof value !== 'number') {
    return '0';
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number') {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortCurrency(value?: number) {
  if (typeof value !== 'number') {
    return '₹0';
  }

  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }

  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }

  if (Math.abs(value) >= 1000) {
    return `₹${Math.round(value / 1000)}K`;
  }

  return formatCurrency(value);
}

function formatVehicleType(value?: string) {
  if (!value) {
    return 'Vehicle';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getVehicleTypeIcon(value?: string): CategoryStat['icon'] {
  if (value === 'bike') {
    return 'motorbike';
  }

  if (value === 'scooty' || value === 'scooter') {
    return 'scooter';
  }

  return 'car-sports';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  fixedHeader: {
    paddingTop: 27,
  },
  content: {
    paddingBottom: 118,
  },
});
