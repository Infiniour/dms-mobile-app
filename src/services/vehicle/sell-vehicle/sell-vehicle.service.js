import { api } from '../../http';
import { sellVehicleEndpoint } from './sell-vehicle.api';

function trimmedOrUndefined(value) {
  const nextValue = typeof value === 'string' ? value.trim() : '';
  return nextValue.length > 0 ? nextValue : undefined;
}

/**
 * The API documents customer.phone_number as '+919999999999' — country code
 * included, with the '+' — while every form in the app collects plain digits.
 * Normalizing here rather than in a screen keeps the two from drifting apart
 * as more entry points are added.
 *
 * A 10-digit number is assumed Indian and gets +91. Anything already carrying
 * a country code is passed through with only its formatting stripped.
 */
function normalizePhoneNumber(value, countryCode = '91') {
  if (typeof value !== 'string') {
    return undefined;
  }

  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) {
    return undefined;
  }

  if (hasPlus) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+${countryCode}${digits}`;
  }

  return `+${digits}`;
}

/**
 * The server parses sale_date with Go's "2006-01-02" layout — a bare calendar
 * date. A full ISO instant ('2024-01-15T14:30:00Z') fails that parse and comes
 * back as a flat "invalid request", so anything date-like is reduced here.
 *
 * Local date parts, not toISOString().slice(0, 10): an 11pm IST sale is still
 * today's sale, and the UTC form would book it to yesterday.
 */
function toApiDate(value) {
  if (!value) {
    return undefined;
  }

  const trimmed = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const pad = (part) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function sellVehicle(vehicleId, { salePrice, saleDate, paymentMode, remarks, customer = {} }) {
  const endpoint = sellVehicleEndpoint.replace(':id', String(vehicleId));

  return api.post(endpoint, {
    sale_price: Number(salePrice),
    sale_date: toApiDate(saleDate),
    payment_mode: trimmedOrUndefined(paymentMode)?.toLowerCase(),
    remarks: trimmedOrUndefined(remarks),
    customer: {
      first_name: trimmedOrUndefined(customer.firstName),
      last_name: trimmedOrUndefined(customer.lastName),
      phone_number: normalizePhoneNumber(customer.phoneNumber, customer.countryCode),
      email: trimmedOrUndefined(customer.email),
      address: trimmedOrUndefined(customer.address),
      city: trimmedOrUndefined(customer.city),
      state: trimmedOrUndefined(customer.state),
      pincode: trimmedOrUndefined(customer.pincode),
    },
  });
}
