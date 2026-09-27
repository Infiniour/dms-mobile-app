import { api } from '../../http';
import { updatePricingEndpoint } from './update-pricing.api';

export function updateVehiclePricing({
  vehicleId,
  buyingPrice,
  buyingDate,
  priceTag,
  taggedAt,
  currency = 'inr',
  remarks,
}) {
  const endpoint = updatePricingEndpoint.replace(':id', String(vehicleId));

  return api.patch(endpoint, {
    buying_price: buyingPrice,
    buying_date: buyingDate,
    price_tag: priceTag,
    tagged_at: taggedAt,
    currency,
    remarks,
  });
}
