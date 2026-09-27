import { api } from '../../http';
import { listShowroomsEndpoint } from './list-showrooms.api';

export function listShowrooms() {
  return api.get(listShowroomsEndpoint);
}
