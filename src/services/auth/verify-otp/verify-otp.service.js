import { api } from '../../http';
import { verifyOtpEndpoint } from './verify-otp.api';

export function verifyOtp({ requestId, otpCode }) {
  return api.post(verifyOtpEndpoint, { requestId, otpCode }, { auth: false });
}
