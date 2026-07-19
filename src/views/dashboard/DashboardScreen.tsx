import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Grid } from '@/constants/theme';
import { useAuthStore } from '@/store';
import { ScreenTopArea } from '@/components/ui';
import { MetricCard } from './components/MetricCard';
import { MetricGrid } from './components/MetricGrid';
import { RangeFilter } from './components/RangeFilter';
import { TopCategories } from './components/TopCategories';
import {
  categories,
  expenseMetrics,
  inventoryMetrics,
  summaryMetrics,
  timeRanges,
} from './data';
import type { TimeRange } from './types';

export function DashboardScreen() {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const fullName = useAuthStore((s) => s.fullName);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1W');
  const firstName = fullName.trim().split(' ')[0] || 'Stevie';
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;
  const cardGap = screenWidth < 360 ? 12 : Grid.columns.gutter;
  const contentWidth = screenWidth - horizontalPadding * 2;
  const compactCardWidth = (contentWidth - cardGap) / 2;
  const isDashboardLoading = false;

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
        <MetricCard {...summaryMetrics[0]} loading={isDashboardLoading} />
        <MetricGrid
          metrics={summaryMetrics.slice(1, 3)}
          cardWidth={compactCardWidth}
          gap={cardGap}
          loading={isDashboardLoading}
        />
        <MetricCard {...summaryMetrics[3]} loading={isDashboardLoading} />

        <MetricGrid
          metrics={inventoryMetrics}
          cardWidth={compactCardWidth}
          gap={cardGap}
          loading={isDashboardLoading}
        />

        {expenseMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} loading={isDashboardLoading} />
        ))}

        <TopCategories categories={categories} loading={isDashboardLoading} />
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
  fixedHeader: {
    paddingTop: 27,
  },
  content: {
    paddingBottom: 118,
  },
});
