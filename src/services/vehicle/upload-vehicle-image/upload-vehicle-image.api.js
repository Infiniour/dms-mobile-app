/**
 * Upload Vehicle Image API.
 *
 * Keep everything for uploading a vehicle photo here: endpoint path, path
 * params, form-data fields, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const uploadVehicleImageEndpoint = '/api/v1/vehicle/:id/image';

export const uploadVehicleImageApi = {
  name: 'Upload Vehicle Image',
  method: 'POST',
  path: uploadVehicleImageEndpoint,
  auth: 'protected',
  description:
    'Upload a vehicle photo. Any showroom member. Multiple photos per label allowed. Stores an object key; response url is a 1-hour signed URL. Blocked when the vehicle is sold.',
  bodyType: 'multipart/form-data',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Vehicle ID',
    },
  ],
  formDataFields: [
    {
      name: 'label',
      example: 'front',
      required: true,
      description: 'front | interior | exterior | back | wheel',
    },
    {
      name: 'photo',
      example: '(file)',
      required: true,
      description: 'jpg/jpeg/png, max 15 MB',
    },
  ],
  curlExample: `curl --location -g '{{base_url}}/api/v1/vehicle/1/image' \\
--header 'Authorization: Bearer <accessToken>' \\
--form 'label="front"' \\
--form 'photo=@/path/to/photo.jpg'`,
  successResponseExample: {
    status: 201,
    body: {
      success: true,
      message: 'vehicle image uploaded',
      data: {
        id: 9,
        vehicle_id: 1,
        label: 'front',
        url: 'https://storage.googleapis.com/dms-dev-assets/7/vehicle/1/20240101120000.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Expires=3600&X-Goog-Signature=...',
        uploaded_at: '2024-01-01T12:00:00Z',
      },
    },
  },
};
