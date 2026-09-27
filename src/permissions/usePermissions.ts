import { useMemo } from 'react';
import { useAuthStore } from '@/store';
import { POLICIES, type Subject } from './policies';
import { resolvePermissions, type Permission, type Role } from './permissions';

export type PermissionCheck = {
  role: Role | null;
  permissions: Set<Permission>;
  /**
   * `can('vehicle:create')` — could I ever do this?
   * `can('employee:delete', member)` — may I do it to this one?
   *
   * The subject form exists from the start so call sites never need migrating
   * when a permission later grows a policy.
   */
  can: (permission: Permission, subject?: Subject) => boolean;
};

export function usePermissions(): PermissionCheck {
  const role = useAuthStore((s) => s.primaryShowroomRole);
  const serverPermissions = useAuthStore((s) => s.permissions);
  const phoneNumber = useAuthStore((s) => s.phoneNumber);

  return useMemo(() => {
    const granted = resolvePermissions(role, serverPermissions);
    const context = { role, phoneNumber };

    const can = (permission: Permission, subject?: Subject) => {
      if (!granted.has(permission)) {
        return false;
      }

      if (subject === undefined) {
        return true;
      }

      const policy = POLICIES[permission];

      return policy ? policy(subject, context) : true;
    };

    return { role, permissions: granted, can };
  }, [role, serverPermissions, phoneNumber]);
}
