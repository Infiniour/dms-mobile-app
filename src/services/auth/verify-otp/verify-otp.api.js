/**
 * Verify OTP API.
 *
 * Keep everything for verifying OTP here: endpoint path, required headers,
 * request body example, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const verifyOtpEndpoint = '/api/v1/auth/verify-otp';

export const verifyOtpApi = {
  name: 'Verify OTP',
  method: 'POST',
  path: verifyOtpEndpoint,
  auth: 'public',
  description: 'Verifies OTP and returns token pair.',
  headers: [
    {
      name: 'Content-Type',
      example: 'application/json',
      required: true,
      description: 'Tells the backend we are sending JSON.',
    },
    {
      name: 'X-Platform',
      example: 'web',
      required: true,
      description: 'Platform making the request.',
    },
    {
      name: 'X-Device-Id',
      example: 'browser-1',
      required: true,
      description: 'Unique id for the current device/session.',
    },
  ],
  requestBodyExample: {
    requestId: 'Ab12Cd34',
    otpCode: '123456',
  },
  curlExample: `curl --location -g '{{base_url}}/api/v1/auth/verify-otp' \\
--header 'Content-Type: application/json' \\
--header 'X-Platform: web' \\
--header 'X-Device-Id: browser-1' \\
--data '{
  "requestId": "Ab12Cd34",
  "otpCode": "123456"
}'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'OTP verified successfully',
      data: {
        accessToken: '...',
        refreshToken: '...',
        expiresIn: 3600,
        tokenType: 'Bearer',
        required_name: true,
      },
    },
  },
};
