import { api } from '../../../http';
import { addMemberEndpoint } from './add-member.api';

export function addMember({ showroomId, name, country_code, phone_number, role }) {
  const endpoint = addMemberEndpoint.replace(':id', String(showroomId));

  return api.post(endpoint, { name, country_code, phone_number, role });
}
