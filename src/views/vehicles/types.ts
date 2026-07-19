import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type VehicleFilter = 'All' | 'Cars' | 'Bikes' | 'Scooty';

export type VehicleStatus = 'Available' | 'Sold' | 'In Repair';

export type VehicleCategory = Exclude<VehicleFilter, 'All'>;

export type VehicleStatusFilter = 'All' | VehicleStatus;

export type VehicleItem = {
  id: string;
  name: string;
  category: VehicleCategory;
  registration: string;
  price: string;
  buyingPrice: string;
  askingPrice: string;
  status: VehicleStatus;
  meta: string;
  note: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  owner: string;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  transmission: string;
  insuranceValidTill: string;
  lotLocation: string;
  expenses: VehicleExpense[];
  documents: VehicleDocument[];
};

export type VehicleExpense = {
  label: string;
  amount: string;
};

export type VehicleDocument = {
  label: string;
  status: 'complete' | 'missing';
};

export type VehicleCategoryTab = {
  label: string;
  value: VehicleCategory;
  count: number;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export type VehicleStat = {
  value: string;
  label: string;
  tone: 'default' | 'success' | 'danger' | 'primary';
};
