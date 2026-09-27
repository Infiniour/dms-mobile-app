import type { MetricStat, TimeRange } from './types';

export const timeRanges: TimeRange[] = ['1W', '1M', '3M', '6M', '12M', 'Lifetime'];

/** Card shells only — titles/icons/layout. Values come from the API. */
export const summaryMetricShells: Omit<MetricStat, 'value' | 'detail' | 'trend' | 'progress'>[] = [
  {
    title: 'Net Profit',
    icon: 'calculator-variant-outline',
    variant: 'primary',
  },
  {
    title: 'Vehicle sale',
    icon: 'car-sports',
    compact: true,
  },
  {
    title: 'Avg / Sale',
    icon: 'chart-line',
    variant: 'blue',
    compact: true,
  },
  {
    title: 'Total Revenue',
    icon: 'currency-inr',
    variant: 'primary',
  },
];

export const inventoryMetricShells: Omit<MetricStat, 'value' | 'detail' | 'trend' | 'progress'>[] = [
  {
    title: 'Inventory',
    icon: 'cube-outline',
    compact: true,
  },
  {
    title: 'Inv. Value',
    icon: 'wallet-outline',
    variant: 'green',
    compact: true,
  },
  {
    title: 'Dead Stock',
    icon: 'alert-outline',
    variant: 'danger',
    compact: true,
  },
  {
    title: 'Avg Age',
    icon: 'clock-outline',
    compact: true,
  },
];

export const expenseMetricShells: Omit<MetricStat, 'value' | 'detail' | 'trend' | 'progress'>[] = [
  {
    title: 'Total Expenses',
    icon: 'receipt-text-outline',
  },
  {
    title: 'Avg Expense / Vehicle',
    icon: 'car-cog',
    variant: 'blue',
  },
];
