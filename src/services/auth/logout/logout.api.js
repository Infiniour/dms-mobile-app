/**
 * Logout API.
 *
 * Keep everything for logout here: endpoint path, required headers, curl
 * example, and success response example.
 *
 * No backend call is made from this file.
 */
export const logoutEndpoint = '/api/v1/auth/logout';

export const logoutApi = {
  name: 'Logout',
  method: 'POST',
  path: logoutEndpoint,
  auth: 'protected',
  description:
    'Auth: Access token, X-Platform, and X-Device-Id headers required. Revokes active sessions for the authenticated user only on the requested platform.',
  headers: [
    {
      name: 'Authorization',
      example: 'Bearer <accessToken>',
      required: true,
      description: 'Bearer access token for the authenticated user.',
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
  requestBodyExample: null,
  curlExample: `curl --location -g -X POST '{{base_url}}/api/v1/auth/logout' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'X-Platform: web' \\
--header 'X-Device-Id: browser-1'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'Logged out successfully',
    },
  },
};
