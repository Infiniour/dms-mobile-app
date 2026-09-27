/**
 * List Showroom Members API.
 *
 * Keep everything for listing showroom members here: endpoint path, path
 * params, query params, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const listMembersEndpoint = '/api/v1/showroom/:id/member';

export const listMembersApi = {
  name: 'List Showroom Members',
  method: 'GET',
  path: listMembersEndpoint,
  auth: 'protected',
  description:
    'Protected. Lists all members of the showroom. Caller must be the showroom owner or manager. Returns paginated list with user_id, name (null if empty), phone_number (null if empty), and role. Defaults: page=1, limit=20, max limit=100.',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Showroom ID',
    },
  ],
  queryParams: [
    {
      name: 'page',
      example: '1',
      required: false,
      description: 'Page number (default: 1, min: 1)',
    },
    {
      name: 'limit',
      example: '20',
      required: false,
      description: 'Items per page (default: 20, min: 1, max: 100)',
    },
  ],
  curlExample: `curl --location -g '{{base_url}}/api/v1/showroom/1/member?page=1&limit=20' \\
--header 'Authorization: Bearer <accessToken>'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'members fetched',
      data: {
        members: [
          {
            user_id: 42,
            name: 'John Doe',
            phone_number: '+91-9876543210',
            role: 'employee',
          },
          {
            user_id: 7,
            name: null,
            phone_number: null,
            role: 'manager',
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
      },
    },
  },
};
