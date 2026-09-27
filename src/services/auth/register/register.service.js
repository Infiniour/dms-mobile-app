import { api } from '../../http';
import { registerEndpoint } from './register.api';

export function register({ countryCode, phoneNumber }) {
  return api.post(registerEndpoint, { countryCode, phoneNumber }, { auth: false });
}
