import { useLocalSearchParams } from 'expo-router';
import { VehicleDetailsScreen } from '@/views/vehicles';

export default function VehicleDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <VehicleDetailsScreen vehicleId={id} />;
}
