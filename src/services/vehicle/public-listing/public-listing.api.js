/**
 * Public Showroom Vehicle Listing API.
 *
 * Keep everything for the public (no-auth) showroom vehicle listing here:
 * endpoint path, query params, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const publicListingEndpoint = '/api/v1/vehicle/public-listing';

export const publicListingApi = {
  name: 'Public Showroom Vehicle Listing',
  method: 'GET',
  path: publicListingEndpoint,
  auth: 'public',
  description:
    'Public endpoint — no auth required. Returns ready_for_sale vehicles in a specific showroom grouped by type (cars/bikes/scooties). Includes price_tag only (no buying details). Supports type filter, price range filter, sort by price, and pagination.',
  queryParams: [
    {
      name: 'showroom_id',
      example: '1',
      required: true,
      description: 'Required: showroom ID to scope the listing',
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
      name: 'sort_by',
      example: 'price_asc',
      required: false,
      description: 'Sort order. Values: price_asc, price_desc. Default: price_asc',
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
  curlExample: `curl --location -g '{{base_url}}/api/v1/vehicle/public-listing?showroom_id=1&sort_by=price_asc&page=1&limit=20'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'vehicle listing',
      data: {
        cars: {
          total: 1,
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
              price_tag: 350000,
              currency: 'inr',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
        bikes: null,
        scooties: null,
      },
    },
  },
};
