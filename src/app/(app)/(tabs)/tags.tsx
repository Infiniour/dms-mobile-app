import { AdminPanelScreen } from '@/views/admin';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function TagsTab() {
  return (
    <RequirePermission permission={PERMISSIONS.TAGS_READ}>
      <AdminPanelScreen />
    </RequirePermission>
  );
}
