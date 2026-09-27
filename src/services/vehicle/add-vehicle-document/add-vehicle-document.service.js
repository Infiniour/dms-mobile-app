import { api } from '../../http';
import { addVehicleDocumentEndpoint } from './add-vehicle-document.api';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];

const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
};

/**
 * The server validates the file type from `filepath.Ext(header.Filename)`, not
 * from the content type — so a part sent without a real extension in its name
 * is rejected as INVALID_FILE_TYPE even when the bytes are fine. Image picker
 * assets frequently arrive with no `name` at all, so one is derived here.
 */
function extensionFor(file) {
  const source = file?.name || file?.uri || '';
  // Strip any query string first: signed/cache URIs end in "?token=..." which
  // would otherwise be read as the extension.
  const candidate = source.split('?')[0].split('.').pop()?.toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(candidate)) {
    return candidate;
  }

  if (file?.type === 'application/pdf') {
    return 'pdf';
  }

  if (file?.type === 'image/png') {
    return 'png';
  }

  return 'jpg';
}

function fileNameFor(file, extension) {
  const name = file?.name?.trim();

  if (name && name.toLowerCase().endsWith(`.${extension}`)) {
    return name;
  }

  return `${name ? name.replace(/\.[^.]*$/, '') : 'document'}.${extension}`;
}

/**
 * Uploads one file against one document type.
 *
 * A document with several pages is several calls with the same `documentType` —
 * the server stores each row separately and groups them by type when reading
 * the vehicle back.
 */
export function addVehicleDocument(vehicleId, { documentType, file }) {
  const endpoint = addVehicleDocumentEndpoint.replace(':id', String(vehicleId));
  const extension = extensionFor(file);
  const formData = new FormData();

  // Sent lowercase to match the documented enum; the server lowercases anyway.
  formData.append('document_type', String(documentType).trim().toLowerCase());
  formData.append('file', {
    uri: file.uri,
    name: fileNameFor(file, extension),
    type: file.type || MIME_BY_EXTENSION[extension],
  });

  return api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
