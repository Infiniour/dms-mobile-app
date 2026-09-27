/**
 * Login API.
 *
 * Keep everything for login here: endpoint path, required headers, request
 * body example, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const loginEndpoint = '/api/v1/auth/login';

export const loginApi = {
  name: 'Login',
  method: 'POST',
  path: loginEndpoint,
  auth: 'public',
  description: 'Triggers OTP for existing user login.',
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
    countryCode: '91',
    phoneNumber: '9999999999',
  },
  curlExample: `curl --location -g '{{base_url}}/api/v1/auth/login' \\
--header 'Content-Type: application/json' \\
--header 'X-Platform: web' \\
--header 'X-Device-Id: browser-1' \\
--data '{
  "countryCode": "91",
  "phoneNumber": "9999999999"
}'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'OTP sent successfully',
      data: {
        message: 'If the account is valid, an OTP has been sent',
        requestId: 'Zx90Qw12',
      },
    },
  },
};
