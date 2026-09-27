import { useLocalSearchParams } from 'expo-router';
import { SellVehicleScreen } from '@/views/sales';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function SellVehicleRoute() {
  const { id, name, registration } = useLocalSearchParams<{
    id: string;
    name?: string;
    registration?: string;
  }>();

  return (
    <RequirePermission permission={PERMISSIONS.SALE_CREATE}>
      <SellVehicleScreen vehicleId={id} vehicleName={name} registration={registration} />
    </RequirePermission>
  );
}
