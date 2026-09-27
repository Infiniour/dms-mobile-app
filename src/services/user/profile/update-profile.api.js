/**
 * Update Profile API.
 *
 * Keep everything for updating the authenticated user's profile name here:
 * endpoint path, required headers, request body example, curl example, and
 * success response example.
 *
 * No backend call is made from this file.
 */
export const updateProfileEndpoint = '/api/v1/user/me';

export const updateProfileApi = {
  name: 'Update Profile',
  method: 'PATCH',
  path: updateProfileEndpoint,
  auth: 'protected',
  description:
    "Protected endpoint (requires Bearer token). Updates authenticated user's profile name. Name must be non-empty after trim and contain only letters, spaces, hyphens, and apostrophes.",
  headers: [
    {
      name: 'Authorization',
      example: 'Bearer <accessToken>',
      required: true,
      description: 'Bearer access token for the authenticated user.',
    },
    {
      name: 'Content-Type',
      example: 'application/json',
      required: true,
      description: 'Tells the backend we are sending JSON.',
    },
  ],
  requestBodyExample: {
    name: 'John Doe',
  },
  curlExample: `curl --location -g -X PATCH '{{base_url}}/api/v1/user/me' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "name": "John Doe"
}'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'profile updated',
      data: {
        name: 'John Doe',
      },
    },
  },
};
