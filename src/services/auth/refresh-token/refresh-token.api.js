/**
 * Refresh Token API.
 *
 * Keep everything for rotating the token pair here: endpoint path, request
 * body example, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const refreshTokenEndpoint = '/api/v1/auth/refresh-token';

export const refreshTokenApi = {
  name: 'Refresh Token',
  method: 'POST',
  path: refreshTokenEndpoint,
  auth: 'public (refresh token based)',
  description: 'Rotates token pair.',
  headers: [
    {
      name: 'Content-Type',
      example: 'application/json',
      required: true,
      description: 'Tells the backend we are sending JSON.',
    },
  ],
  requestBodyExample: {
    refreshToken: '...',
  },
  curlExample: `curl --location -g '{{base_url}}/api/v1/auth/refresh-token' \\
--header 'Content-Type: application/json' \\
--data '{
  "refreshToken": "..."
}'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: '...',
        refreshToken: '...',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    },
  },
};
