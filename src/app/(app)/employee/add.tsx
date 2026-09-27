import { AddEmployeeScreen } from '@/views/employees';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function AddEmployeeRoute() {
  return (
    <RequirePermission permission={PERMISSIONS.EMPLOYEE_CREATE}>
      <AddEmployeeScreen />
    </RequirePermission>
  );
}
