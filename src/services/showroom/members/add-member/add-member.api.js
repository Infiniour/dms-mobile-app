/**
 * Add Showroom Member API.
 *
 * Keep everything for adding a showroom member here: endpoint path, path
 * params, request body example, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const addMemberEndpoint = '/api/v1/showroom/:id/member';

export const addMemberApi = {
  name: 'Add Showroom Member',
  method: 'POST',
  path: addMemberEndpoint,
  auth: 'protected',
  description:
    "Protected. Adds a user as a member of the showroom. Caller must be the showroom owner or manager. Owner can assign role 'manager' or 'employee'. Manager can only assign role 'employee'. Role must be one of: manager, employee.",
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Showroom ID',
    },
  ],
  requestBodyExample: {
    user_id: 42,
    role: 'employee',
  },
  curlExample: `curl --location -g '{{base_url}}/api/v1/showroom/1/member' \\
--header 'Authorization: Bearer <accessToken>' \\
--header 'Content-Type: application/json' \\
--data '{
  "user_id": 42,
  "role": "employee"
}'`,
  successResponseExample: {
    status: 201,
    body: {
      success: true,
      message: 'member added',
      data: {
        showroom_id: 1,
        user_id: 42,
        role: 'employee',
      },
    },
  },
};
