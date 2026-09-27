import { AddVehicleScreen } from '@/views/vehicles';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function AddVehicleRoute() {
  return (
    <RequirePermission permission={PERMISSIONS.VEHICLE_CREATE} redirectTo="/(tabs)/vehicles">
      <AddVehicleScreen />
    </RequirePermission>
  );
}
