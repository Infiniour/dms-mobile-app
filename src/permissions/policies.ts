import { PERMISSIONS, type Permission, type Role } from './permissions';

/**
 * Rules that depend on the thing being acted on, not just on the role.
 *
 * These run only after the flat permission check passes, so a policy can
 * narrow access but never grant it. Keeping them here avoids inventing
 * permissions like `employee:deleteButNotOwner`, which multiply forever.
 */

export type MemberSubject = {
  user_id?: number;
  phone_number?: string | null;
  role?: string | null;
};

export type Subject = MemberSubject;

export type PolicyContext = {
  role: Role | null;
  phoneNumber: string;
};

type Policy = (subject: Subject, context: PolicyContext) => boolean;

function isSelf(member: MemberSubject, context: PolicyContext) {
  return Boolean(context.phoneNumber) && member.phone_number === context.phoneNumber;
}

export const POLICIES: Partial<Record<Permission, Policy>> = {
  // Only owners reach this permission at all. They still cannot demote
  // themselves, and the owner seat is not editable.
  [PERMISSIONS.EMPLOYEE_UPDATE]: (member, context) =>
    !isSelf(member, context) && member.role !== 'owner',

  // The owner seat cannot be removed, and a manager may only remove employees.
  // Self-removal exists in the API but is deliberately not offered here.
  [PERMISSIONS.EMPLOYEE_DELETE]: (member, context) => {
    if (isSelf(member, context) || member.role === 'owner') {
      return false;
    }

    if (context.role === 'manager') {
      return member.role === 'employee';
    }

    return true;
  },
};
