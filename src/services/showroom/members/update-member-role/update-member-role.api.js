/**
 * Update Member Role API.
 *
 * Keep everything for updating a showroom member's role here: endpoint path,
 * path params, request body example, curl example, and success response
 * example.
 *
 * No backend call is made from this file.
 */
export const updateMemberRoleEndpoint = '/api/v1/showroom/:id/member/:user_id';

export const updateMemberRoleApi = {
  name: 'Update Member Role',
  method: 'PATCH',
  path: updateMemberRoleEndpoint,
  auth: 'protected',
  description:
    'Protected. Updates the role of a showroom member. Caller must be the showroom owner. Owner cannot change their own role. New role must be one of: manager, employee.',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Showroom ID',
    },
    {
      name: 'user_id',
      example: '42',
      description: 'User ID of the member whose role to update',
    },
  ],
  requestBodyExample: {
    role: 'manager',
  },
  curlExample: `curl --location -g -X PATCH '{{base_url}}/api/v1/showroom/1/member/42' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "role": "manager"
}'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'member role updated',
      data: null,
    },
  },
};
