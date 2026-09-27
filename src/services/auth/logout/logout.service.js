import { api } from '../../http';
import { logoutEndpoint } from './logout.api';

export function logout() {
  return api.post(logoutEndpoint, undefined, {
    meta: {
      reportErrors: false,
    },
  });
}
