import { ShowroomEditScreen } from '@/views/showroom/ShowroomEditScreen';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function ShowroomEditRoute() {
  return (
    <RequirePermission permission={PERMISSIONS.SHOWROOM_UPDATE}>
      <ShowroomEditScreen />
    </RequirePermission>
  );
}
