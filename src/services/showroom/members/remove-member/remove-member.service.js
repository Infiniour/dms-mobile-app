import { api } from '../../../http';
import { removeMemberEndpoint } from './remove-member.api';

export function removeMember({ showroomId, userId }) {
  const endpoint = removeMemberEndpoint
    .replace(':id', String(showroomId))
    .replace(':user_id', String(userId));

  return api.delete(endpoint);
}
