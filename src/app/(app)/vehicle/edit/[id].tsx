import { useLocalSearchParams } from 'expo-router';
import { EditVehicleScreen } from '@/views/vehicles';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function EditVehicleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RequirePermission permission={PERMISSIONS.VEHICLE_UPDATE} redirectTo="/(tabs)/vehicles">
      <EditVehicleScreen vehicleId={id} />
    </RequirePermission>
  );
}
