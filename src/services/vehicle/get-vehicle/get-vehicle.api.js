/**
 * Get Vehicle API.
 *
 * Keep everything for fetching a single vehicle's details here: endpoint
 * path, path params, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const getVehicleEndpoint = '/api/v1/vehicle/:id';

export const getVehicleApi = {
  name: 'Get Vehicle',
  method: 'GET',
  path: getVehicleEndpoint,
  auth: 'protected',
  description:
    'Get vehicle details by ID. Any showroom member. Owner receives admin fields (buying price, expenses, documents). All roles receive an images section grouped by label, with signed URLs and image ids for delete.',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Vehicle ID',
    },
  ],
  curlExample: `curl --location -g '{{base_url}}/api/v1/vehicle/1' \\
--header 'Authorization: Bearer <accessToken>'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'vehicle details',
      data: {
        basic: {
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
          current_status: {
            status: 'garage',
            started_at: '2024-01-01T00:00:00Z',
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        buying_details: {
          buying_price: 200000,
          buying_date: '2024-01-01T00:00:00Z',
          currency: 'inr',
          remarks: '',
        },
        pricing: {
          price_tag: 350000,
          tagged_at: '2024-01-01T00:00:00Z',
          currency: 'inr',
        },
        status: {
          current: {
            status: 'garage',
            description: '',
            started_at: '2024-01-01T00:00:00Z',
            ended_at: '0001-01-01T00:00:00Z',
          },
          history: [
            {
              status: 'garage',
              description: '',
              started_at: '2024-01-01T00:00:00Z',
              ended_at: '0001-01-01T00:00:00Z',
            },
          ],
        },
        expenses: [],
        documents: [],
        images: {
          front: [
            {
              id: 9,
              url: 'https://storage.googleapis.com/dms-dev-assets/7/vehicle/1/20240101120000.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Expires=3600&X-Goog-Signature=...',
            },
          ],
          interior: [
            {
              id: 11,
              url: 'https://storage.googleapis.com/dms-dev-assets/7/vehicle/1/20240101121000.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Expires=3600&X-Goog-Signature=...',
            },
          ],
        },
      },
    },
  },
};
