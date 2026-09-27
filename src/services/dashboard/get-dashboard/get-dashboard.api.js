/**
 * Get Dashboard API.
 *
 * Keep everything for fetching the dealership dashboard overview here:
 * endpoint path, query params, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const getDashboardEndpoint = '/api/v1/dashboard';

export const getDashboardApi = {
  name: 'Get Dashboard',
  method: 'GET',
  path: getDashboardEndpoint,
  auth: 'protected',
  description:
    'Protected. Returns dealership health overview: sales performance, inventory state, expense summary, and top vehicle types. Duration filters sales and expenses; inventory reflects current state.',
  queryParams: [
    {
      name: 'duration',
      example: '1m',
      required: false,
      description: '1w | 1m | 3m | 6m | 12m | lifetime (default: lifetime)',
    },
    {
      name: 'showroom_id',
      example: '',
      required: false,
      description: 'Optional. Filter by showroom.',
    },
  ],
  curlExample: `curl --location -g '{{base_url}}/api/v1/dashboard?duration=1m' \\
--header 'Authorization: Bearer <accessToken>'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'dashboard data fetched',
      data: {
        sales_summary: {
          vehicles_sold: 15,
          total_revenue: 3000000,
          net_profit: 930000,
          average_profit_per_sale: 62000,
        },
        inventory_summary: {
          inventory_count: 45,
          inventory_value: 12000000,
          dead_stock_count: 6,
          average_inventory_age_days: 38,
        },
        expense_summary: {
          total_expenses: 70000,
          average_expense_per_vehicle: 1555.56,
        },
        top_vehicle_types: [
          { vehicle_type: 'car', vehicles_sold: 8, net_profit: 500000 },
          { vehicle_type: 'bike', vehicles_sold: 5, net_profit: 300000 },
          { vehicle_type: 'scooty', vehicles_sold: 2, net_profit: 130000 },
        ],
      },
    },
  },
};
