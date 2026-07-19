import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type DashboardIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export type MetricVariant = 'primary' | 'surface' | 'blue' | 'green' | 'danger';

export type MetricStat = {
  title: string;
  value: string;
  detail: string;
  icon: DashboardIconName;
  variant?: MetricVariant;
  compact?: boolean;
  trend?: string;
  progress?: number;
};

export type CategoryStat = {
  icon: DashboardIconName;
  name: string;
  description: string;
  sold: string;
  amount: string;
};

export type TimeRange = '1W' | '1M' | '3M' | '6M' | '12M' | 'Lifetime';
