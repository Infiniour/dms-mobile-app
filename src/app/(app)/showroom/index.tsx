import { ShowroomListScreen } from '@/views/showroom/ShowroomListScreen';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function ShowroomListRoute() {
  return (
    <RequirePermission permission={PERMISSIONS.SHOWROOM_READ}>
      <ShowroomListScreen />
    </RequirePermission>
  );
}
