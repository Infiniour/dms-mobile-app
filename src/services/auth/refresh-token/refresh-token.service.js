import { api } from '../../http';
import { refreshTokenEndpoint } from './refresh-token.api';

/**
 * Manual refresh call. The http client already refreshes the token pair
 * automatically on a 401 — this is only for an explicit, user-triggered
 * refresh.
 */
export function refreshToken({ refreshToken: token }) {
  return api.post(refreshTokenEndpoint, { refreshToken: token }, { auth: false });
}
