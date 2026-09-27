import { api } from '../../http';
import { updateProfileEndpoint } from './update-profile.api';

export function updateProfile({ name }) {
  return api.patch(updateProfileEndpoint, { name });
}
