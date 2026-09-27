import { api } from '../../http';

export function updateVehicleStatus(vehicleId, { status, description }) {
  return api.post(`/api/v1/vehicle/${vehicleId}/status`, {
    status: status.trim().toLowerCase(),
    description: description ? description.trim() : undefined,
  });
}
