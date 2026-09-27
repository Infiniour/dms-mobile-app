import { api } from '../../http';
import { loginEndpoint } from './login.api';

// Mobile auth starts from sendOtp(). Keep this only if the backend exposes
// /auth/login for another client or a future flow.
export function login({ countryCode, phoneNumber }) {
  return api.post(
    loginEndpoint,
    { countryCode: countryCode.replace(/\D/g, ''), phoneNumber },
    { auth: false }
  );
}
