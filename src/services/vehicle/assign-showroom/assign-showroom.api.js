/**
 * Assign Vehicle to Showroom API.
 *
 * Keep everything for assigning a vehicle to a showroom here: endpoint path,
 * path params, request body example, curl example, and success response
 * example.
 *
 * No backend call is made from this file.
 */
export const assignShowroomEndpoint = '/api/v1/vehicle/:id/showroom';

export const assignShowroomApi = {
  name: 'Assign Vehicle to Showroom',
  method: 'POST',
  path: assignShowroomEndpoint,
  auth: 'protected',
  description:
    'Assign a vehicle to a showroom. Caller must be owner or manager of the target showroom. A vehicle can only be assigned to one showroom.',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Vehicle ID',
    },
  ],
  requestBodyExample: {
    showroom_id: 1,
  },
  curlExample: `curl --location -g '{{base_url}}/api/v1/vehicle/1/showroom' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "showroom_id": 1
}'`,
  successResponseExample: {
    status: 201,
    body: {
      success: true,
      message: 'vehicle assigned to showroom',
      data: {
        vehicle_id: 1,
        showroom_id: 1,
        assigned_at: '2024-03-15T10:00:00Z',
      },
    },
  },
};
