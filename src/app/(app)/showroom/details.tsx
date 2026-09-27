import { ShowroomDetailsScreen } from '@/views/showroom/ShowroomDetailsScreen';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function ShowroomDetailsRoute() {
  return (
    <RequirePermission permission={PERMISSIONS.SHOWROOM_READ}>
      <ShowroomDetailsScreen />
    </RequirePermission>
  );
}
