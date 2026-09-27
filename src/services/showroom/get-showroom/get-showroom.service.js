import { api } from '../../http';

export function getShowroom(showroomId) {
  return api.get(`/api/v1/showroom/${showroomId}`);
}
