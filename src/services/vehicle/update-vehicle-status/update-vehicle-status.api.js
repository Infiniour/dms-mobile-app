/**
 * Update Vehicle Status API.
 *
 * Keep everything for updating vehicle status here:
 * endpoint path, required headers, request body example, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const updateVehicleStatusEndpoint = '/api/v1/vehicle/:id/status';

export const updateVehicleStatusApi = {
  name: 'Update Vehicle Status',
  method: 'POST',
  path: updateVehicleStatusEndpoint,
  auth: 'protected',
  description:
    'Protected endpoint (requires Bearer token). Updates the status of a vehicle. Only accessible to showroom members.',
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
    status: 'available',
    description: 'Vehicle is ready for sale',
  },
  curlExample: `curl --location -g -X POST '{{base_url}}/api/v1/vehicle/1/status' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "status": "available",
  "description": "Vehicle is ready for sale"
}'`,
  successResponseExample: {
    status: 201,
    body: {
      success: true,
      message: 'vehicle status updated',
      data: {
        id: 1,
        vehicle_id: 1,
        status: 'available',
        description: 'Vehicle is ready for sale',
        started_at: '2024-01-01T10:00:00Z',
        added_by: 1,
      },
    },
  },
};
