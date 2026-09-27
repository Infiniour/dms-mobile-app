import { api } from '../../http';
import { createVehicleEndpoint } from './create-vehicle.api';

function numberOrUndefined(value) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
}

export function createVehicle({
  vehicleType,
  manufacturer,
  model,
  variant,
  color,
  yearOfManufacture,
  rtoCode,
  registrationNumber,
  registrationState,
  usageKm,
  fuelType,
  transmissionType,
}) {
  return api.post(createVehicleEndpoint, {
    vehicle_type: vehicleType.trim().toLowerCase(),
    manufacturer: manufacturer.trim(),
    model: model.trim(),
    variant: variant.trim(),
    color: color.trim(),
    year_of_manufacture: numberOrUndefined(yearOfManufacture),
    rto_code: rtoCode.trim().toUpperCase(),
    registration_number: registrationNumber.replace(/\s/g, '').toUpperCase(),
    registration_state: registrationState.trim(),
    usage_km: numberOrUndefined(usageKm),
    fuel_type: fuelType.trim().toLowerCase(),
    transmission_type: transmissionType.trim().toLowerCase(),
  });
}
