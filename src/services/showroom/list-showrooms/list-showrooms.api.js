/**
 * List Showrooms API.
 *
 * Keep everything for listing showrooms here: endpoint path, query params,
 * curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const listShowroomsEndpoint = '/api/v1/showroom';

export const listShowroomsApi = {
  name: 'List Showrooms',
  method: 'GET',
  path: listShowroomsEndpoint,
  auth: 'protected',
  description:
    'Protected. Lists active showrooms for the authenticated user. Returns every active showroom membership with numeric id, generated showroom_id, name, and the user\'s role in that showroom. If the user has no active showroom memberships, returns success true with an empty showrooms array.',
  queryParams: [],
  curlExample: `curl --location -g -X GET '{{base_url}}/api/v1/showroom' \\
--header 'Authorization: Bearer <accessToken>'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'showrooms fetched',
      data: {
        showrooms: [
          {
            id: 1,
            showroom_id: 'SHOP0001',
            name: 'Main Showroom',
            role: 'owner',
          },
          {
            id: 2,
            showroom_id: 'SHOP0002',
            name: 'Second Showroom',
            role: 'manager',
          },
        ],
      },
    },
  },
};
