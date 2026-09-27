import { ShowroomCreateScreen } from '@/views/showroom/ShowroomCreateScreen';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function ShowroomCreateRoute() {
  return (
    <RequirePermission permission={PERMISSIONS.SHOWROOM_UPDATE}>
      <ShowroomCreateScreen />
    </RequirePermission>
  );
}
