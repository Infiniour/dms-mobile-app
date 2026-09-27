import { api } from '../../../http';
import { listMembersEndpoint } from './list-members.api';

export function listMembers({ showroomId, page = 1, limit = 20 }) {
  const endpoint = listMembersEndpoint.replace(':id', String(showroomId));

  return api.get(endpoint, { params: { page, limit } });
}
