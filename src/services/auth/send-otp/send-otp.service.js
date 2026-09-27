import { api } from '../../http';
import { sendOtpEndpoint } from './send-otp.api';

export function sendOtp({ countryCode, phoneNumber }) {
  return api.post(
    sendOtpEndpoint,
    { countryCode: countryCode.replace(/\D/g, ''), phoneNumber },
    { auth: false }
  );
}
