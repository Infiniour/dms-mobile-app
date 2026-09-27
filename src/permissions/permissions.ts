/**
 * Every action the app can perform, as `resource:action`.
 *
 * Screens ask for capabilities, never for roles. Adding a role should mean
 * editing ROLE_PERMISSIONS below and nothing else.
 */
export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',

  VEHICLE_READ: 'vehicle:read',
  VEHICLE_CREATE: 'vehicle:create',
  VEHICLE_UPDATE: 'vehicle:update',
  VEHICLE_DELETE: 'vehicle:delete',
  /** Buying price / cost — owner & manager only; employees see asking price. */
  VEHICLE_COST_READ: 'vehicle:cost:read',
  /** Change garage / inspection / available state. */
  VEHICLE_STATUS_UPDATE: 'vehicle:status:update',
  /** Upload and view vehicle documents. */
  VEHICLE_DOCUMENT_UPDATE: 'vehicle:document:update',

  EMPLOYEE_READ: 'employee:read',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',

  EXPENSE_CREATE: 'expense:create',

  SALE_READ: 'sale:read',
  SALE_CREATE: 'sale:create',

  SHOWROOM_READ: 'showroom:read',
  SHOWROOM_UPDATE: 'showroom:update',

  REPORTS_READ: 'reports:read',

  TAGS_READ: 'tags:read',
  TAGS_UPDATE: 'tags:update',

  NOTIFICATION_READ: 'notification:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type Role = 'owner' | 'manager' | 'employee';

const ALL_PERMISSIONS = new Set<string>(Object.values(PERMISSIONS));

/**
 * Roles compose so a new role is one line, not a copied list.
 *
 * Mirrors what the API already enforces: managers may add members and edit the
 * showroom, only owners may change a member's role or delete a vehicle.
 */
// Employees browse inventory, update state/docs, and sell — not cost or core edit.
const EMPLOYEE_PERMISSIONS: Permission[] = [
  PERMISSIONS.VEHICLE_READ,
  PERMISSIONS.VEHICLE_STATUS_UPDATE,
  PERMISSIONS.VEHICLE_DOCUMENT_UPDATE,
  PERMISSIONS.SHOWROOM_READ,
  PERMISSIONS.SALE_READ,
  PERMISSIONS.SALE_CREATE,
];

const MANAGER_PERMISSIONS: Permission[] = [
  ...EMPLOYEE_PERMISSIONS,
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.VEHICLE_CREATE,
  PERMISSIONS.VEHICLE_UPDATE,
  PERMISSIONS.VEHICLE_COST_READ,
  PERMISSIONS.EMPLOYEE_READ,
  PERMISSIONS.EMPLOYEE_CREATE,
  PERMISSIONS.EMPLOYEE_DELETE,
  PERMISSIONS.EXPENSE_CREATE,
  PERMISSIONS.SHOWROOM_UPDATE,
  PERMISSIONS.REPORTS_READ,
  PERMISSIONS.TAGS_READ,
  PERMISSIONS.TAGS_UPDATE,
  PERMISSIONS.NOTIFICATION_READ,
];

const OWNER_PERMISSIONS: Permission[] = [
  ...MANAGER_PERMISSIONS,
  PERMISSIONS.VEHICLE_DELETE,
  PERMISSIONS.EMPLOYEE_UPDATE,
];

/**
 * Local fallback used until the API returns a resolved permission list.
 * Once it does, this only covers offline / older responses.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  employee: EMPLOYEE_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  owner: OWNER_PERMISSIONS,
};

/** Roles we understand. Anything else is treated as unknown and gets nothing. */
export function normalizeRole(value: string | null | undefined): Role | null {
  const role = value?.trim().toLowerCase();

  if (role === 'owner' || role === 'manager' || role === 'employee') {
    return role;
  }

  return null;
}

/**
 * Resolves what the current user may do.
 *
 * Prefers the list the server sent, so permission changes ship as config rather
 * than as an app release. Unknown keys are dropped, which lets the backend add
 * permissions before the app knows their names. Unknown roles get an empty set:
 * a bug should read as "I cannot see it", never as unearned access.
 */
export function resolvePermissions(
  role: Role | null,
  serverPermissions?: string[] | null
): Set<Permission> {
  if (serverPermissions?.length) {
    return new Set(serverPermissions.filter((p): p is Permission => ALL_PERMISSIONS.has(p)));
  }

  if (!role) {
    return new Set();
  }

  return new Set(ROLE_PERMISSIONS[role]);
}
