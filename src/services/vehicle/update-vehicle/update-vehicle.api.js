/**
 * Update Vehicle (Core Fields) API.
 *
 * Keep everything for updating a vehicle's core fields here: endpoint path,
 * path params, request body example, curl example, and success response
 * example.
 *
 * No backend call is made from this file.
 */
export const updateVehicleEndpoint = '/api/v1/vehicle/:id';

export const updateVehicleApi = {
  name: 'Update Vehicle (Core Fields)',
  method: 'PATCH',
  path: updateVehicleEndpoint,
  auth: 'protected',
  description:
    'Partially update core vehicle fields (registration_number is immutable). Requires showroom membership. Returns 422 if vehicle is sold.',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Vehicle ID',
    },
  ],
  requestBodyExample: {
    manufacturer: 'Honda',
    model: 'City',
    color: 'White',
    usage_km: 35000,
    fuel_type: 'petrol',
    transmission_type: 'manual',
  },
  curlExample: `curl --location -g -X PATCH '{{base_url}}/api/v1/vehicle/1' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "manufacturer": "Honda",
  "model": "City",
  "color": "White",
  "usage_km": 35000,
  "fuel_type": "petrol",
  "transmission_type": "manual"
}'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'vehicle updated',
      data: {
        id: 1,
        vehicle_type: 'car',
        manufacturer: 'Honda',
        model: 'City',
        variant: 'V',
        color: 'White',
        year_of_manufacture: 2021,
        rto_code: 'KA-01',
        registration_number: 'KA01AB1234',
        registration_state: 'Karnataka',
        usage_km: 35000,
        fuel_type: 'petrol',
        transmission_type: 'manual',
        updated_at: '2024-06-01T10:00:00Z',
      },
    },
  },
};
