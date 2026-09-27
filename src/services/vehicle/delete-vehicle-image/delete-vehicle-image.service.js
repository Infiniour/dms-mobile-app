import { api } from '../../http';
import { deleteVehicleImageEndpoint } from './delete-vehicle-image.api';

export function deleteVehicleImage({ vehicleId, imageId }) {
  const endpoint = deleteVehicleImageEndpoint
    .replace(':id', String(vehicleId))
    .replace(':image_id', String(imageId));

  return api.delete(endpoint);
}
