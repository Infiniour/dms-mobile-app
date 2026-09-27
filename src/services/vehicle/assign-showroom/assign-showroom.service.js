import { api } from '../../http';
import { assignShowroomEndpoint } from './assign-showroom.api';

export function assignShowroom({ vehicleId, showroomId }) {
  const endpoint = assignShowroomEndpoint.replace(':id', String(vehicleId));

  return api.post(endpoint, {
    showroom_id: showroomId,
  });
}
