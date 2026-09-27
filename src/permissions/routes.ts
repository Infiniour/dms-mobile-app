import { PERMISSIONS, type Permission } from './permissions';

/**
 * One table drives both the tab bar and the route guards, so a screen can never
 * be visible-but-unguarded. `null` means every signed-in user may open it.
 *
 * Adding a screen is one row here plus a <RequirePermission> at its top.
 */
export const TAB_PERMISSIONS: Record<string, Permission | null> = {
  index: PERMISSIONS.DASHBOARD_READ,
  vehicles: PERMISSIONS.VEHICLE_READ,
  sales: PERMISSIONS.SALE_READ,
  tags: PERMISSIONS.TAGS_READ,
  account: null,
};

export const ROUTE_PERMISSIONS: Record<string, Permission | null> = {
  '/employees': PERMISSIONS.EMPLOYEE_READ,
  '/employee/add': PERMISSIONS.EMPLOYEE_CREATE,
  '/showroom/edit': PERMISSIONS.SHOWROOM_UPDATE,
  '/vehicle/add': PERMISSIONS.VEHICLE_CREATE,
  '/vehicle/expense/[id]': PERMISSIONS.EXPENSE_CREATE,
  '/vehicle/sell/[id]': PERMISSIONS.SALE_CREATE,
  '/vehicle/documents/[id]': PERMISSIONS.VEHICLE_DOCUMENT_UPDATE,
  '/notifications': PERMISSIONS.NOTIFICATION_READ,
};

/**
 * Where to send someone who lands on a screen they may not open. Account has no
 * permission requirement, so redirecting there can never loop.
 */
export const SAFE_ROUTE = '/(tabs)/account';
