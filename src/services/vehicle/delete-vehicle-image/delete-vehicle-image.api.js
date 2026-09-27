/**
 * Delete Vehicle Image API.
 *
 * Keep everything for soft-deleting a vehicle photo here: endpoint path,
 * path params, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const deleteVehicleImageEndpoint = '/api/v1/vehicle/:id/image/:image_id';

export const deleteVehicleImageApi = {
  name: 'Delete Vehicle Image',
  method: 'DELETE',
  path: deleteVehicleImageEndpoint,
  auth: 'protected',
  description:
    'Soft-delete a vehicle photo. Any showroom member. Blocked when the vehicle is sold. Does not delete the object from storage.',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Vehicle ID',
    },
    {
      name: 'image_id',
      example: '9',
      description: 'Vehicle image ID',
    },
  ],
  curlExample: `curl --location -g -X DELETE '{{base_url}}/api/v1/vehicle/1/image/9' \\
--header 'Authorization: Bearer <accessToken>'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'vehicle image deleted',
    },
  },
};
