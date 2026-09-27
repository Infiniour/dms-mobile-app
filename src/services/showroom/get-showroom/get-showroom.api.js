/**
 * Get Showroom API.
 *
 * Keep everything for fetching a specific showroom here:
 * endpoint path, required headers, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const getShowroomEndpoint = '/api/v1/showroom/:id';

export const getShowroomApi = {
  name: 'Get Showroom',
  method: 'GET',
  path: getShowroomEndpoint,
  auth: 'protected',
  description:
    'Protected endpoint (requires Bearer token). Returns detailed information about a specific showroom. The caller must have a role in the showroom.',
  headers: [
    {
      name: 'Authorization',
      example: 'Bearer <accessToken>',
      required: true,
      description: 'Bearer access token for the authenticated user.',
    },
  ],
  requestBodyExample: null,
  curlExample: `curl --location -g '{{base_url}}/api/v1/showroom/1' \\
--header 'Authorization: Bearer <accessToken>'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'showroom fetched',
      data: {
        id: 1,
        showroom_id: 'SR001',
        name: 'Downtown Showroom',
        showroom_logo: 'https://example.com/logo.png',
        showroom_banner: 'https://example.com/banner.png',
        geolocation: { latitude: 12.9716, longitude: 77.5946 },
        role: 'owner',
      },
    },
  },
};
