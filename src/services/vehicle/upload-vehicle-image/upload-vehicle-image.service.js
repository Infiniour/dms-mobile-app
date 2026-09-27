import { api } from '../../http';
import { uploadVehicleImageEndpoint } from './upload-vehicle-image.api';

function extensionFromImage(image) {
  const source = image?.name || image?.uri || '';
  const extension = source.split('.').pop()?.toLowerCase();

  if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
    return extension;
  }

  return 'jpg';
}

function mimeTypeFromImage(image) {
  if (image?.type) {
    return image.type;
  }

  const extension = extensionFromImage(image);
  return extension === 'png' ? 'image/png' : 'image/jpeg';
}

/**
 * @param {{ vehicleId: number, label: 'front' | 'interior' | 'exterior' | 'back' | 'wheel', photo: { uri: string, name?: string | null, type?: string | null } }} options
 */
export function uploadVehicleImage({ vehicleId, label, photo }) {
  const endpoint = uploadVehicleImageEndpoint.replace(':id', String(vehicleId));
  const formData = new FormData();

  formData.append('label', label);
  formData.append('photo', {
    uri: photo.uri,
    name: photo.name || `${label}.${extensionFromImage(photo)}`,
    type: mimeTypeFromImage(photo),
  });

  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
