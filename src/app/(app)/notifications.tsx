import { NotificationsScreen } from '@/views/notifications';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function NotificationsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.NOTIFICATION_READ}>
      <NotificationsScreen />
    </RequirePermission>
  );
}
