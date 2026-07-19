import { StyleSheet, View } from 'react-native';
import { MetricCard } from './MetricCard';
import type { MetricStat } from '../types';

type MetricGridProps = {
  metrics: MetricStat[];
  cardWidth: number;
  gap: number;
  loading?: boolean;
};

export function MetricGrid({ metrics, cardWidth, gap, loading }: MetricGridProps) {
  return (
    <View style={[styles.grid, { columnGap: gap }]}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          {...metric}
          loading={loading}
          width={metric.compact ? cardWidth : '100%'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
