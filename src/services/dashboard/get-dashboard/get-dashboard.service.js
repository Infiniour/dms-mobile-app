import { api } from '../../http';
import { getDashboardEndpoint } from './get-dashboard.api';

/**
 * @param {{
 *   duration?: '1w' | '1m' | '3m' | '6m' | '12m' | 'lifetime',
 *   showroomId?: number,
 * }} [options]
 */
export function getDashboard({ duration = 'lifetime', showroomId } = {}) {
  return api.get(getDashboardEndpoint, {
    params: {
      duration,
      showroom_id: showroomId,
    },
  });
}
