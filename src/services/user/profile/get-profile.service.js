import { api } from '../../http';
import { getProfileEndpoint } from './get-profile.api';

export function getProfile() {
  return api.get(getProfileEndpoint);
}
