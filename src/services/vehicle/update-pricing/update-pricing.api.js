/**
 * Update Vehicle Pricing API.
 *
 * Keep everything for creating/updating a vehicle's pricing here: endpoint
 * path, path params, request body example, curl example, and success
 * response example.
 *
 * No backend call is made from this file.
 */
export const updatePricingEndpoint = '/api/v1/vehicle/:id/pricing';

export const updatePricingApi = {
  name: 'Update Vehicle Pricing',
  method: 'PATCH',
  path: updatePricingEndpoint,
  auth: 'protected',
  description:
    'Create or update vehicle pricing. If no pricing record exists, buying_price and buying_date are required. Requires showroom membership. Returns 422 if vehicle is sold.',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Vehicle ID',
    },
  ],
  requestBodyExample: {
    buying_price: 200000,
    buying_date: '2023-01-10',
    price_tag: 350000,
    tagged_at: '2023-06-01T08:00:00Z',
    currency: 'inr',
    remarks: 'Good condition',
  },
  curlExample: `curl --location -g -X PATCH '{{base_url}}/api/v1/vehicle/1/pricing' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "buying_price": 200000,
  "buying_date": "2023-01-10",
  "price_tag": 350000,
  "tagged_at": "2023-06-01T08:00:00Z",
  "currency": "inr",
  "remarks": "Good condition"
}'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'vehicle pricing updated',
      data: {
        vehicle_id: 1,
        buying_price: 200000,
        buying_date: '2023-01-10',
        price_tag: 350000,
        tagged_at: '2023-06-01T08:00:00Z',
        currency: 'inr',
        remarks: 'Good condition',
        updated_at: '2024-06-01T10:00:00Z',
      },
    },
  },
};
