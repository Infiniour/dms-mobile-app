/**
 * List Vehicles by Category API.
 *
 * Keep everything for listing inventory vehicles grouped by category here:
 * endpoint path, query params, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const listVehiclesEndpoint = '/api/v1/vehicle/listing';

export const listVehiclesApi = {
  name: 'List Vehicles by Category',
  method: 'GET',
  path: listVehiclesEndpoint,
  auth: 'protected',
  description:
    'List vehicles in a showroom grouped by category (cars, bikes, scooties). Requires showroom_id; caller must be a member of that showroom. Defaults to all statuses. Supports filtering by status, type, and price range with pagination.',
  queryParams: [
    {
      name: 'showroom_id',
      example: '1',
      required: true,
      description: 'Required: numeric showroom ID. Caller must be a member of this showroom.',
    },
    {
      name: 'status',
      example: '',
      required: false,
      description:
        'Filter by status (repeatable). Values: garage, inspection, ready_for_sale, sold. Default: all statuses',
    },
    {
      name: 'type',
      example: 'car',
      required: false,
      description: 'Filter by vehicle type (repeatable). Values: car, bike, scooty. Default: all',
    },
    {
      name: 'min_price',
      example: '',
      required: false,
      description: 'Minimum price_tag filter',
    },
    {
      name: 'max_price',
      example: '',
      required: false,
      description: 'Maximum price_tag filter',
    },
    {
      name: 'page',
      example: '1',
      required: false,
      description: 'Page number (min 1)',
    },
    {
      name: 'limit',
      example: '20',
      required: false,
      description: 'Items per page (1–100)',
    },
  ],
  curlExample: `curl --location -g '{{base_url}}/api/v1/vehicle/listing?showroom_id=1&page=1&limit=20' \\
--header 'Authorization: Bearer <accessToken>'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'vehicle listing',
      data: {
        cars: {
          total: 2,
          page: 1,
          limit: 20,
          vehicles: [
            {
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
                status: 'ready_for_sale',
                started_at: '2024-01-01T00:00:00Z',
              },
              pricing: {
                buying_price: 200000,
                price_tag: 350000,
                currency: 'inr',
                tagged_at: '2024-01-01T00:00:00Z',
              },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
        bikes: {
          total: 0,
          page: 1,
          limit: 20,
          vehicles: [],
        },
        scooties: {
          total: 0,
          page: 1,
          limit: 20,
          vehicles: [],
        },
      },
    },
  },
};
