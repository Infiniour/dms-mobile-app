import { useLocalSearchParams } from 'expo-router';
import { AddExpenseScreen } from '@/views/vehicles';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function AddExpenseRoute() {
  const { id, name, registration } = useLocalSearchParams<{
    id: string;
    name?: string;
    registration?: string;
  }>();

  return (
    <RequirePermission permission={PERMISSIONS.EXPENSE_CREATE} redirectTo="/(tabs)/vehicles">
      <AddExpenseScreen vehicleId={id} vehicleName={name} vehicleRegistration={registration} />
    </RequirePermission>
  );
}
