/**
 * Sell Vehicle API.
 *
 * Keep everything for selling a vehicle here:
 * endpoint path, required headers, request body example, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const sellVehicleEndpoint = '/api/v1/vehicle/:id/sale';

export const sellVehicleApi = {
  name: 'Sell Vehicle',
  method: 'POST',
  path: sellVehicleEndpoint,
  auth: 'protected',
  description:
    'Protected endpoint (requires Bearer token). Records the sale of a vehicle with customer details and payment information. ' +
    'Required: sale_price (> 0), payment_mode, customer.first_name, customer.last_name, customer.phone_number, customer.address. ' +
    'sale_date is optional and must be a bare calendar date (YYYY-MM-DD) — a full ISO instant is rejected. ' +
    'payment_mode must be one of: cash, cheque, bank_transfer, online, credit, debit, other.',
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
    sale_price: 750000,
    sale_date: '2024-01-15',
    payment_mode: 'credit',
    remarks: 'Sold to customer',
    customer: {
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '+919999999999',
      email: 'john@example.com',
      address: '123 Main St',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
  },
  curlExample: `curl --location -g -X POST '{{base_url}}/api/v1/vehicle/1/sale' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "sale_price": 750000,
  "sale_date": "2024-01-15",
  "payment_mode": "credit",
  "remarks": "Sold to customer",
  "customer": {
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+919999999999",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }
}'`,
  successResponseExample: {
    status: 201,
    body: {
      success: true,
      message: 'vehicle sold',
      data: {
        id: 1,
        vehicle_id: 1,
        sale_price: 750000,
        sale_date: '2024-01-15',
        payment_mode: 'credit',
        remarks: 'Sold to customer',
        customer: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          phone_number: '+919999999999',
          email: 'john@example.com',
          address: '123 Main St',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
        },
        sold_by: {
          user_id: 1,
          name: 'Agent Name',
          country_code: '91',
          phone_number: '9999999999',
        },
      },
    },
  },
};
