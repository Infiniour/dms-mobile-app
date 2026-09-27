import { ManageEmployeesScreen } from '@/views/employees';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function EmployeesRoute() {
  return (
    <RequirePermission permission={PERMISSIONS.EMPLOYEE_READ}>
      <ManageEmployeesScreen />
    </RequirePermission>
  );
}
