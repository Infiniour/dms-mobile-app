/**
 * Update Showroom API.
 *
 * Keep everything for updating a showroom here: endpoint path, path params,
 * form-data fields, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const updateShowroomEndpoint = '/api/v1/showroom/:id';

export const updateShowroomApi = {
  name: 'Update Showroom',
  method: 'PATCH',
  path: updateShowroomEndpoint,
  auth: 'protected',
  description:
    'Protected. Updates showroom details. Caller must be owner or manager. All fields are optional — only provided fields are updated. File upload is best-effort; upload failure leaves the existing file unchanged.',
  bodyType: 'multipart/form-data',
  pathParams: [
    {
      name: 'id',
      example: '1',
      description: 'Showroom ID',
    },
  ],
  formDataFields: [
    {
      name: 'name',
      example: 'Updated Showroom Name',
      required: false,
      description: 'New display name. Skipped if blank.',
    },
    {
      name: 'geolocation',
      example:
        '{"address":"456 New St","city":"Mumbai","state":"Maharashtra","pincode":"400001","lat":19.076,"lng":72.8777}',
      required: false,
      description: 'JSON string replacing existing geolocation.',
    },
    {
      name: 'showroom_logo',
      example: '(file)',
      required: false,
      description: 'New logo. jpg/jpeg/png, max 10 MB.',
    },
    {
      name: 'showroom_banner',
      example: '(file)',
      required: false,
      description: 'New banner. jpg/jpeg/png, max 10 MB.',
    },
    {
      name: 'remove_logo',
      example: 'true',
      required: false,
      description: "Set to 'true' to clear the logo. Ignored if a new logo file is also uploaded.",
    },
    {
      name: 'remove_banner',
      example: 'true',
      required: false,
      description: "Set to 'true' to clear the banner. Ignored if a new banner file is also uploaded.",
    },
  ],
  curlExample: `curl --location -g -X PATCH '{{base_url}}/api/v1/showroom/1' \\
--header 'Authorization: Bearer <accessToken>' \\
--form 'name="Updated Showroom Name"'`,
  successResponseExample: {
    status: 200,
    body: {
      success: true,
      message: 'showroom updated',
      data: {
        id: 1,
        showroom_id: 'SR001',
        name: 'Updated Showroom Name',
        showroom_logo: null,
        showroom_banner: '1/1/20240101120000.jpg',
        geolocation: {
          address: '456 New St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          lat: 19.076,
          lng: 72.8777,
        },
      },
    },
  },
};
