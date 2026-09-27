import { api } from '../../http';
import { publicListingEndpoint } from './public-listing.api';

export function getPublicListing({
  showroomId,
  type,
  minPrice,
  maxPrice,
  sortBy = 'price_asc',
  page = 1,
  limit = 20,
}) {
  return api.get(publicListingEndpoint, {
    auth: false,
    params: {
      showroom_id: showroomId,
      type,
      min_price: minPrice,
      max_price: maxPrice,
      sort_by: sortBy,
      page,
      limit,
    },
  });
}
