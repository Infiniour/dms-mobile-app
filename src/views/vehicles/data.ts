import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type SelectOption = {
  value: string;
  label: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export type ExpenseType =
  | 'repair'
  | 'service'
  | 'insurance'
  | 'tax'
  | 'inspection'
  | 'cleaning'
  | 'documentation'
  | 'other';

export type ExpenseCategory = {
  value: ExpenseType;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

// The API only accepts these eight values, so the chips are the enum itself
// rather than a friendlier set that would fail validation on submit.
export const expenseCategoryOptions: ExpenseCategory[] = [
  { value: 'repair', label: 'Repair', icon: 'wrench-outline' },
  { value: 'service', label: 'Service', icon: 'car-wrench' },
  { value: 'insurance', label: 'Insurance', icon: 'shield-check-outline' },
  { value: 'tax', label: 'Tax', icon: 'receipt' },
  { value: 'inspection', label: 'Inspection', icon: 'clipboard-check-outline' },
  { value: 'cleaning', label: 'Cleaning', icon: 'spray-bottle' },
  { value: 'documentation', label: 'Papers', icon: 'file-document-outline' },
  { value: 'other', label: 'Other', icon: 'dots-horizontal' },
];

// Confirmed against the API: ApiVehicle['vehicle_type'] is 'car' | 'bike' | 'scooty'.
export const vehicleTypeOptions: SelectOption[] = [
  { value: 'car', label: 'Car', icon: 'car-hatchback' },
  { value: 'bike', label: 'Bike', icon: 'motorbike' },
  { value: 'scooty', label: 'Scooty', icon: 'scooter' },
];

// NOT confirmed against the backend — the API docs only show one example value
// each ('petrol', 'manual'), not a full enum. If a save fails with an
// unrecognized value, add it here; every screen picks it up from this list.
export const fuelTypeOptions: SelectOption[] = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'cng', label: 'CNG' },
  { value: 'electric', label: 'Electric' },
];

export const transmissionTypeOptions: SelectOption[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
];

// Full names, matching what the API expects for registration_state
// (confirmed against create-vehicle/update-vehicle docs, e.g. "Karnataka").
const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export const indianStateOptions: SelectOption[] = INDIAN_STATES_AND_UTS.map((name) => ({
  value: name,
  label: name,
}));

const CURRENT_YEAR = new Date().getFullYear();

// Descending so the most likely year (recent) is at the top of the sheet.
export const yearOfManufactureOptions: SelectOption[] = Array.from(
  { length: CURRENT_YEAR - 1980 + 2 },
  (_, index) => {
    const year = CURRENT_YEAR + 1 - index;
    return { value: String(year), label: String(year) };
  }
);
