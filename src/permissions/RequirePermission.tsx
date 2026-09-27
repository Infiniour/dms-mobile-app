import { Redirect } from 'expo-router';
import { usePermissions } from './usePermissions';
import { SAFE_ROUTE } from './routes';
import type { Permission } from './permissions';

type RequirePermissionProps = {
  permission: Permission;
  /** Where to send someone who may not be here. Must be a route they can open. */
  redirectTo?: string;
  children: React.ReactNode;
};

/**
 * The actual rule. Hiding a tab is only cosmetic — a deep link or a stray
 * router.push still mounts the screen — so every restricted screen carries this.
 */
export function RequirePermission({
  permission,
  redirectTo = SAFE_ROUTE,
  children,
}: RequirePermissionProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return <Redirect href={redirectTo} />;
  }

  return <>{children}</>;
}
