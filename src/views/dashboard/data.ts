import type { CategoryStat, MetricStat, TimeRange } from './types';

export const timeRanges: TimeRange[] = ['1W', '1M', '3M', '6M', '12M', 'Lifetime'];

export const summaryMetrics: MetricStat[] = [
  {
    title: 'Net Profit',
    value: '₹9,30,000',
    detail: '+15.2% vs last month',
    trend: '+15.2% vs last month',
    icon: 'calculator-variant-outline',
    variant: 'primary',
  },
  {
    title: 'Vehicle sale',
    value: '15',
    detail: '+ 12 %',
    trend: '+ 12 %',
    icon: 'car-sports',
    compact: true,
  },
  {
    title: 'Avg / Sale',
    value: '₹62K',
    detail: 'On target',
    icon: 'chart-line',
    variant: 'blue',
    compact: true,
  },
  {
    title: 'Total Revenue',
    value: '₹30,00,000',
    detail: '+8.4% vs last month',
    trend: '+8.4% vs last month',
    icon: 'currency-inr',
    variant: 'primary',
  },
];

export const inventoryMetrics: MetricStat[] = [
  {
    title: 'Inventory',
    value: '45',
    detail: 'Units in lot',
    icon: 'cube-outline',
    compact: true,
  },
  {
    title: 'Inv. Value',
    value: '₹1.2Cr',
    detail: 'Asset Value',
    icon: 'wallet-outline',
    variant: 'green',
    compact: true,
  },
  {
    title: 'Dead Stock',
    value: '6',
    detail: '60+ days old',
    icon: 'alert-outline',
    variant: 'danger',
    compact: true,
  },
  {
    title: 'Avg Age',
    value: '38',
    detail: 'Days · turnover',
    icon: 'clock-outline',
    compact: true,
  },
];

export const expenseMetrics: MetricStat[] = [
  {
    title: 'Total Expenses',
    value: '₹70,000',
    detail: '75% of monthly budget used',
    icon: 'receipt-text-outline',
    progress: 75,
  },
  {
    title: 'Avg Expense / Vehicle',
    value: '₹1,555',
    detail: 'Logistics & handling',
    icon: 'car-cog',
    variant: 'blue',
  },
];

export const categories: CategoryStat[] = [
  {
    icon: 'car-sports',
    name: 'Car',
    description: 'Premium & Executive',
    sold: '8 Sold',
    amount: '₹5,00,000',
  },
  {
    icon: 'motorbike',
    name: 'Bike',
    description: 'Sports & Commuter',
    sold: '5 Sold',
    amount: '₹3,00,000',
  },
  {
    icon: 'scooter',
    name: 'Scooty',
    description: 'Urban Electric & Petrol',
    sold: '2 Sold',
    amount: '₹1,30,000',
  },
];
