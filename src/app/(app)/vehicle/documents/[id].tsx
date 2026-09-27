import { useLocalSearchParams } from 'expo-router';
import { VehicleDocumentsScreen } from '@/views/vehicles/VehicleDocumentsScreen';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function VehicleDocumentsRoute() {
  const { id, name, registration } = useLocalSearchParams<{
    id: string;
    name?: string;
    registration?: string;
  }>();

  return (
    <RequirePermission permission={PERMISSIONS.VEHICLE_DOCUMENT_UPDATE}>
      <VehicleDocumentsScreen vehicleId={id} vehicleName={name} registration={registration} />
    </RequirePermission>
  );
}
