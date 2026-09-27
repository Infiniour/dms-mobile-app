/**
 * Create Vehicle API.
 *
 * Keep everything for creating a vehicle here: endpoint path, request body
 * example, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const createVehicleEndpoint = '/api/v1/vehicle';

export const createVehicleApi = {
  name: 'Create Vehicle',
  method: 'POST',
  path: createVehicleEndpoint,
  auth: 'protected',
  description: 'Create a new vehicle in inventory.',
  requestBodyExample: {
    vehicle_type: 'car',
    manufacturer: 'Toyota',
    model: 'Camry',
    variant: 'LE',
    color: 'Black',
    year_of_manufacture: 2020,
    rto_code: 'KA-01',
    registration_number: 'KA01AB1234',
    registration_state: 'Karnataka',
    usage_km: 50000,
    fuel_type: 'petrol',
    transmission_type: 'manual',
  },
  curlExample: `curl --location -g '{{base_url}}/api/v1/vehicle' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "vehicle_type": "car",
  "manufacturer": "Toyota",
  "model": "Camry",
  "variant": "LE",
  "color": "Black",
  "year_of_manufacture": 2020,
  "rto_code": "KA-01",
  "registration_number": "KA01AB1234",
  "registration_state": "Karnataka",
  "usage_km": 50000,
  "fuel_type": "petrol",
  "transmission_type": "manual"
}'`,
  successResponseExample: {
    status: 201,
    body: {
      success: true,
      message: 'vehicle created',
      data: {
        id: 1,
        vehicle_type: 'car',
        manufacturer: 'Toyota',
        model: 'Camry',
        variant: 'LE',
        color: 'Black',
        year_of_manufacture: 2020,
        rto_code: 'KA-01',
        registration_number: 'KA01AB1234',
        registration_state: 'Karnataka',
        usage_km: 50000,
        fuel_type: 'petrol',
        transmission_type: 'manual',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
  },
};
