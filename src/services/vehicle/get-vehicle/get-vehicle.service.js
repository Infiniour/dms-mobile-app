import { api } from '../../http';
import { getVehicleEndpoint } from './get-vehicle.api';

export function getVehicle({ vehicleId }) {
  const endpoint = getVehicleEndpoint.replace(':id', String(vehicleId));

  return api.get(endpoint);
}
