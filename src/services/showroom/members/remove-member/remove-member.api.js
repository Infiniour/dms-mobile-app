/**
 * Remove Showroom Member API.
 *
 * Keep everything for removing a showroom member here: endpoint path, path
 * params, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const removeMemberEndpoint = '/api/v1/showroom/:id/member/:user_id';

export const removeMemberApi = {
  name: 'Remove Showroom Member',
  method: 'DELETE',
  path: removeMemberEndpoint,
  auth: 'protected',
  description:
    'Protected. Removes a member from the showroom (soft-delete). Caller must be owner, manager, or the member themselves. Owner can remove any member. Manager can only remove employees. Any member can remove themselves (self-removal). Owner cannot be removed.',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Showroom ID',
    },
    {
      name: 'user_id',
      example: '42',
      description: 'User ID of the member to remove',
    },
  ],
  requestBodyExample: null,
  curlExample: `curl --location -g -X DELETE '{{base_url}}/api/v1/showroom/1/member/42' \\
--header 'Authorization: Bearer <accessToken>'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'member removed',
      data: null,
    },
  },
};
