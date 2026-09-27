import type { VehicleItem } from '@/views/vehicles/types';

/**
 * A vehicle as the sales panel needs it.
 *
 * `soldAt` is the moment the vehicle entered the `sold` status, which the list
 * endpoint reports as `current_status.started_at`. The listing payload carries
 * no separate sale record, so this is what "Sold Today" counts.
 */
export type SaleVehicle = VehicleItem & {
  soldAt?: string;
};

/**
 * Verified against the server's `isValidPaymentMode` in
 * internal/modules/vehicle/service.go — anything outside this set is rejected
 * as a flat "invalid request".
 *
 * Note there is no `loan` / `finance` value, which a used-car dealer really
 * does need; `other` is the closest the API currently allows.
 */
export const PAYMENT_MODES = [
  { value: 'bank_transfer', label: 'Bank transfer', icon: 'business-outline' },
  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
  { value: 'online', label: 'UPI / Online', icon: 'phone-portrait-outline' },
  { value: 'cheque', label: 'Cheque', icon: 'document-outline' },
  { value: 'credit', label: 'Credit card', icon: 'card-outline' },
  { value: 'debit', label: 'Debit card', icon: 'card-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number]['value'];

/**
 * The charges that make up the invoice total.
 *
 * `sellingPrice` is what the buyer actually agreed to, which is distinct from
 * the vehicle's asking price (`pricing.price_tag`) and is the only one of these
 * three the sale API has a field for — it becomes `sale_price`. The server's
 * profit maths is `sale_price - buying_price - expenses`, so the two pass-through
 * fees below must stay out of it.
 */
export type InvoiceCharges = {
  sellingPrice: string;
  rtoTransferFee: string;
  serviceCharge: string;
};
