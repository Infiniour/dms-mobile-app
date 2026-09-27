/**
 * Add Vehicle Expense API.
 *
 * Keep everything for adding a vehicle expense record here: endpoint path,
 * path params, request body example, curl example, and success response
 * example.
 *
 * No backend call is made from this file.
 */
export const addExpenseEndpoint = '/api/v1/vehicle/:id/expense';

export const addExpenseApi = {
  name: 'Add Vehicle Expense',
  method: 'POST',
  path: addExpenseEndpoint,
  auth: 'protected',
  description:
    'Add an expense record to a vehicle. Requires showroom membership. Type must be one of: repair, service, insurance, tax, inspection, cleaning, documentation, other.',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Vehicle ID',
    },
  ],
  requestBodyExample: {
    type: 'repair',
    amount: 5000.0,
    paid_to: 'City Motors',
    description: 'Engine oil change and brake pad replacement',
    date: '2024-03-15T10:00:00Z',
  },
  curlExample: `curl --location -g '{{base_url}}/api/v1/vehicle/1/expense' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "type": "repair",
  "amount": 5000.00,
  "paid_to": "City Motors",
  "description": "Engine oil change and brake pad replacement",
  "date": "2024-03-15T10:00:00Z"
}'`,
  successResponseExample: {
    status: 201,
    body: {
      success: true,
      message: 'expense added',
      data: {
        id: 1,
        vehicle_id: 1,
        type: 'repair',
        amount: 5000.0,
        paid_to: 'City Motors',
        description: 'Engine oil change and brake pad replacement',
        date: '2024-03-15T10:00:00Z',
        created_at: '2024-03-15T10:00:00Z',
      },
    },
  },
};
