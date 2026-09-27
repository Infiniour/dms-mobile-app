/**
 * Create Showroom API.
 *
 * Keep everything for creating a showroom here: endpoint path, form-data
 * fields, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const createShowroomEndpoint = '/api/v1/showroom';

export const createShowroomApi = {
  name: 'Create Showroom',
  method: 'POST',
  path: createShowroomEndpoint,
  auth: 'protected',
  description:
    'Protected. Creates a new showroom and assigns the authenticated user as the owner in a single transaction. Accepts multipart/form-data with optional logo and banner images (jpg/jpeg/png, max 10 MB each). Files are stored locally at {STORAGE_BASE_PATH}/{userID}/{showroomID}/{datetime}.{ext}.',
  bodyType: 'multipart/form-data',
  formDataFields: [
    {
      name: 'name',
      example: 'My Showroom',
      required: true,
      description: 'Showroom display name.',
    },
    {
      name: 'geolocation',
      example:
        '{"address":"123 Main St","city":"Bengaluru","state":"Karnataka","pincode":"560001","lat":12.9716,"lng":77.5946}',
      required: false,
      description: 'JSON string with address, city, state, pincode, lat, lng.',
    },
    {
      name: 'showroom_logo',
      example: '(file)',
      required: false,
      description: 'jpg/jpeg/png, max 10 MB.',
    },
    {
      name: 'showroom_banner',
      example: '(file)',
      required: false,
      description: 'jpg/jpeg/png, max 10 MB.',
    },
  ],
  curlExample: `curl --location -g '{{base_url}}/api/v1/showroom' \\
--header 'Authorization: Bearer <accessToken>' \\
--form 'name="My Showroom"' \\
--form 'geolocation="{\\"address\\":\\"123 Main St\\",\\"city\\":\\"Bengaluru\\",\\"state\\":\\"Karnataka\\",\\"pincode\\":\\"560001\\",\\"lat\\":12.9716,\\"lng\\":77.5946}"' \\
--form 'showroom_logo=@/path/to/logo.jpg'`,
  successResponseExample: {
    status: 201,
    body: {
      success: true,
      message: 'showroom created',
      data: {
        id: 1,
        showroom_id: 'SR001',
        name: 'My Showroom',
        showroom_logo: '1/1/20240101120000.jpg',
        showroom_banner: null,
        geolocation: {
          address: '123 Main St',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          lat: 12.9716,
          lng: 77.5946,
        },
      },
    },
  },
};
