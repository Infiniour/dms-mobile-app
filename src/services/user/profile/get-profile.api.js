/**
 * Get Profile API.
 *
 * Keep everything for fetching the authenticated user's profile here:
 * endpoint path, required headers, curl example, and success response
 * example.
 *
 * No backend call is made from this file.
 */
export const getProfileEndpoint = '/api/v1/user/me';

export const getProfileApi = {
  name: 'Get Profile',
  method: 'GET',
  path: getProfileEndpoint,
  auth: 'protected',
  description:
    "Protected endpoint (requires Bearer token). Returns the authenticated user's profile including name, phone number, and all showroom-role pairs. Fields are nullable.",
  headers: [
    {
      name: 'Authorization',
      example: 'Bearer <accessToken>',
      required: true,
      description: 'Bearer access token for the authenticated user.',
    },
  ],
  requestBodyExample: null,
  curlExample: `curl --location -g '{{base_url}}/api/v1/user/me' \\
--header 'Authorization: Bearer <accessToken>'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'profile fetched',
      data: {
        name: 'John Doe',
        phone_number: '+919999999999',
        showroom_roles: [
          { showroom_id: 1, showroom_name: 'Showroom A', role: 'owner' },
          { showroom_id: 2, showroom_name: 'Showroom B', role: 'manager' },
        ],
      },
    },
  },
};
