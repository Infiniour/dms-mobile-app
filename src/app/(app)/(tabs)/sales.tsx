import { SalesPanelScreen } from '@/views/sales';
import { PERMISSIONS, RequirePermission } from '@/permissions';

export default function SalesTab() {
  return (
    <RequirePermission permission={PERMISSIONS.SALE_READ}>
      <SalesPanelScreen />
    </RequirePermission>
  );
}
