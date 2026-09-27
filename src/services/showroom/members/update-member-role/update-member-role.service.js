import { api } from '../../../http';
import { updateMemberRoleEndpoint } from './update-member-role.api';

export function updateMemberRole({ showroomId, userId, role }) {
  const endpoint = updateMemberRoleEndpoint
    .replace(':id', String(showroomId))
    .replace(':user_id', String(userId));

  return api.patch(endpoint, { role });
}
