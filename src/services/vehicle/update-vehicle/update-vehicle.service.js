import { api } from '../../http';
import { updateVehicleEndpoint } from './update-vehicle.api';

function numberOrUndefined(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
}

export function updateVehicle({
  vehicleId,
  vehicleType,
  manufacturer,
  model,
  variant,
  color,
  yearOfManufacture,
  rtoCode,
  registrationState,
  usageKm,
  fuelType,
  transmissionType,
}) {
  const endpoint = updateVehicleEndpoint.replace(':id', String(vehicleId));

  return api.patch(endpoint, {
    vehicle_type: vehicleType?.trim().toLowerCase(),
    manufacturer: manufacturer?.trim(),
    model: model?.trim(),
    variant: variant?.trim(),
    color: color?.trim(),
    year_of_manufacture: numberOrUndefined(yearOfManufacture),
    rto_code: rtoCode?.trim().toUpperCase(),
    registration_state: registrationState?.trim(),
    usage_km: numberOrUndefined(usageKm),
    fuel_type: fuelType?.trim().toLowerCase(),
    transmission_type: transmissionType?.trim().toLowerCase(),
  });
}
