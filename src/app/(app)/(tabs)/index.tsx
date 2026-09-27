import { DashboardScreen } from '@/views/dashboard';
import { PERMISSIONS, RequirePermission } from '@/permissions';

// This is the app's landing route, so a user without dashboard access lands here
// before anything else and has to be moved on to their first allowed tab.
export default function DashboardTab() {
  return (
    <RequirePermission permission={PERMISSIONS.DASHBOARD_READ} redirectTo="/(tabs)/vehicles">
      <DashboardScreen />
    </RequirePermission>
  );
}
