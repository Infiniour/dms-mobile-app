/**
 * Add Vehicle Document API.
 *
 * Keep everything for uploading vehicle documents here:
 * endpoint path, required headers, request body example, curl example, and success response example.
 *
 * No backend call is made from this file.
 */
export const addVehicleDocumentEndpoint = '/api/v1/vehicle/:id/document';

export const addVehicleDocumentApi = {
  name: 'Add Vehicle Document',
  method: 'POST',
  path: addVehicleDocumentEndpoint,
  auth: 'protected',
  description:
    'Protected endpoint. Uploads ONE file against one document type; a multi-page document is one call per page with the same document_type. ' +
    'Caller must be a member of the vehicle\'s showroom, else 404 VEHICLE_NOT_FOUND. ' +
    'document_type must be one of: registration_certificate, insurance, pollution (trimmed and lowercased server-side). ' +
    'File: jpg/jpeg/png/pdf, max 15 MB, and the whole multipart form is capped at 20 MB. ' +
    'The type is validated from the FILENAME extension, not the content type — a part with no extension is rejected as INVALID_FILE_TYPE. ' +
    'Uploading to a sold vehicle returns 422 VEHICLE_UPDATE_FORBIDDEN. ' +
    'There is no delete endpoint for documents, so an uploaded file cannot be removed from the app.',
  headers: [
    {
      name: 'Authorization',
      example: 'Bearer <accessToken>',
      required: true,
      description: 'Bearer access token for the authenticated user.',
    },
    {
      name: 'Content-Type',
      example: 'multipart/form-data',
      required: true,
      description: 'Multipart form data for file upload.',
    },
  ],
  requestBodyExample: {
    document_type: 'RC',
    file: '<binary file data>',
  },
  curlExample: `curl --location -g -X POST '{{base_url}}/api/v1/vehicle/1/document' \\
--header 'Authorization: Bearer <accessToken>' \\
--form 'document_type="RC"' \\
--form 'file=@/path/to/document.pdf'`,
  successResponseExample: {
    status: 201,
    body: {
      success: true,
      message: 'vehicle document uploaded',
      data: {
        id: 1,
        vehicle_id: 1,
        document_type: 'RC',
        url: 'https://example.com/documents/vehicle-1-rc.pdf',
        uploaded_at: '2024-01-01T12:00:00Z',
      },
    },
  },
};
