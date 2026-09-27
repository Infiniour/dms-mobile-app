import { DOCUMENT_SLOTS } from './documents';
import type {
  VehicleCategory,
  VehicleDocument,
  VehicleItem,
  VehicleSale,
  VehicleStatus,
} from './types';

export type ApiVehicleStatus = 'garage' | 'inspection' | 'ready_for_sale' | 'sold';

export type ApiVehicleImage = {
  id: number;
  url: string;
};

/**
 * Images arrive grouped by section, e.g. `{ exterior: [...], interior: [...] }`,
 * and the key is simply absent when a vehicle has no photos in that section.
 */
export type ApiVehicleImages = Record<string, ApiVehicleImage[] | undefined>;

// Sections are tried in this order when picking the card/hero thumbnail.
// Aligned with the upload API's documented label enum
// (front | interior | exterior | back | wheel) rather than guessed values.
const IMAGE_SECTION_PRIORITY = ['exterior', 'front', 'interior', 'back', 'wheel'];

export type ApiVehicle = {
  id: number;
  vehicle_type: 'car' | 'bike' | 'scooty';
  manufacturer: string;
  model: string;
  variant?: string | null;
  color?: string | null;
  year_of_manufacture: number;
  rto_code?: string | null;
  registration_number: string;
  registration_state?: string | null;
  usage_km: number;
  fuel_type: string;
  transmission_type: string;
  current_status?: { status: ApiVehicleStatus; started_at?: string } | null;
  pricing?: {
    buying_price?: number;
    price_tag?: number;
    currency?: string;
    tagged_at?: string;
  } | null;
  images?: ApiVehicleImages | null;
};

export type ApiVehicleGroup = {
  total: number;
  page: number;
  limit: number;
  vehicles: ApiVehicle[];
};

export type ApiVehicleListing = {
  cars: ApiVehicleGroup;
  bikes: ApiVehicleGroup;
  scooties: ApiVehicleGroup;
};

export type ApiVehicleExpense = {
  id: number;
  vehicle_id: number;
  type: string;
  amount: number;
  paid_to?: string | null;
  description?: string | null;
  date: string;
};

export type ApiVehicleDetail = {
  basic: {
    id: number;
    vehicle_type: ApiVehicle['vehicle_type'];
    manufacturer: string;
    model: string;
    variant?: string | null;
    color?: string | null;
    year_of_manufacture: number;
    rto_code?: string | null;
    registration_number: string;
    registration_state?: string | null;
    usage_km: number;
    fuel_type: string;
    transmission_type: string;
    current_status?: { status: ApiVehicleStatus; started_at?: string } | null;
  };
  buying_details?: { buying_price?: number | null; buying_date?: string | null } | null;
  pricing?: {
    price_tag?: number | null;
    tagged_at?: string | null;
    currency?: string | null;
  } | null;
  expenses?: ApiVehicleExpense[] | null;
  images?: ApiVehicleImages | null;
  /**
   * Grouped by document type, e.g. `{ insurance: [{ id, url }] }`. URLs are
   * signed and expire, so they are for viewing now, not for storing.
   */
  documents?: Record<string, { id: number; url: string }[] | undefined> | null;
  /**
   * Present only once the vehicle is sold. Note the customer's phone arrives as
   * `phone` here, while the sale endpoint's own response calls the same value
   * `phone_number` — the server is inconsistent, so both are read below.
   */
  selling?: {
    sale_price?: number | null;
    sale_date?: string | null;
    payment_mode?: string | null;
    receipt_url?: string | null;
    remarks?: string | null;
    customer?: {
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
      phone?: string | null;
      phone_number?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
    } | null;
    sold_by?: {
      user_id?: number;
      name?: string | null;
      country_code?: string | null;
      phone_number?: string | null;
    } | null;
  } | null;
};

export function categoryToApiGroupKey(category: VehicleCategory): keyof ApiVehicleListing {
  if (category === 'Bikes') {
    return 'bikes';
  }

  if (category === 'Scooty') {
    return 'scooties';
  }

  return 'cars';
}

function mapApiStatus(status?: ApiVehicleStatus | null): VehicleStatus {
  if (status === 'ready_for_sale') {
    return 'Available';
  }

  if (status === 'sold') {
    return 'Sold';
  }

  if (status === 'inspection') {
    return 'Inspection';
  }

  return 'In Garage';
}

/**
 * The inverse of `mapApiStatus`, for screens that need to hand the API back the
 * status a vehicle is already in — the change-state sheet preselects with it.
 */
export function toApiStatus(status: VehicleStatus): ApiVehicleStatus {
  if (status === 'Available') {
    return 'ready_for_sale';
  }

  if (status === 'Sold') {
    return 'sold';
  }

  if (status === 'Inspection') {
    return 'inspection';
  }

  return 'garage';
}

function mapVehicleIcon(vehicleType: ApiVehicle['vehicle_type']): VehicleItem['icon'] {
  if (vehicleType === 'bike') {
    return 'motorbike';
  }

  if (vehicleType === 'scooty') {
    return 'scooter';
  }

  return 'car-hatchback';
}

function mapVehicleCategory(vehicleType: ApiVehicle['vehicle_type']): VehicleCategory {
  if (vehicleType === 'bike') {
    return 'Bikes';
  }

  if (vehicleType === 'scooty') {
    return 'Scooty';
  }

  return 'Cars';
}

function formatExpenseAmount(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatExpenseDate(dateString?: string) {
  if (!dateString) {
    return undefined;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRupees(amount?: number | null) {
  if (amount === undefined || amount === null) {
    return '—';
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1).replace('.0', '')}L`;
  }

  if (amount >= 1000) {
    return `₹${Math.round(amount / 1000)}K`;
  }

  return `₹${amount}`;
}

function formatUsageKm(km: number) {
  if (km >= 1000) {
    return `${Math.round(km / 1000)}K km`;
  }

  return `${km} km`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function daysSince(dateString?: string) {
  if (!dateString) {
    return null;
  }

  const diffMs = Date.now() - new Date(dateString).getTime();

  if (!Number.isFinite(diffMs)) {
    return null;
  }

  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
}

function formatNote(status: VehicleStatus, startedAt?: string) {
  const days = daysSince(startedAt);

  if (days === null) {
    return '';
  }

  if (status === 'Sold') {
    return `Sold ${days} days ago`;
  }

  if (status === 'Available') {
    return `${days} days in lot`;
  }

  if (status === 'Inspection') {
    return `In inspection ${days} days`;
  }

  return `In garage ${days} days`;
}

export function collectImages(images?: ApiVehicleImages | null): ApiVehicleImage[] {
  if (!images) {
    return [];
  }

  const known = IMAGE_SECTION_PRIORITY.flatMap((section) => images[section] ?? []);
  const rest = Object.entries(images)
    .filter(([section]) => !IMAGE_SECTION_PRIORITY.includes(section))
    .flatMap(([, sectionImages]) => sectionImages ?? []);

  return [...known, ...rest].filter((image) => Boolean(image?.url));
}

export type ApiVehicleImageWithLabel = ApiVehicleImage & { label: string };

/** Like collectImages, but keeps each photo's source section as its label — used to group the Edit screen's photo picker by slot (front/back/interior/exterior/wheel). */
export function collectImagesWithLabels(
  images?: ApiVehicleImages | null
): ApiVehicleImageWithLabel[] {
  if (!images) {
    return [];
  }

  const known = IMAGE_SECTION_PRIORITY.flatMap((section) =>
    (images[section] ?? [])
      .filter((image) => Boolean(image?.url))
      .map((image) => ({ ...image, label: section }))
  );
  const rest = Object.entries(images)
    .filter(([section]) => !IMAGE_SECTION_PRIORITY.includes(section))
    .flatMap(([label, sectionImages]) =>
      (sectionImages ?? [])
        .filter((image) => Boolean(image?.url))
        .map((image) => ({ ...image, label }))
    );

  return [...known, ...rest];
}

export function mapApiVehicleToItem(vehicle: ApiVehicle): VehicleItem {
  const status = mapApiStatus(vehicle.current_status?.status);
  const buyingPrice = formatRupees(vehicle.pricing?.buying_price);
  const askingPrice = formatRupees(vehicle.pricing?.price_tag);
  const images = collectImages(vehicle.images);

  return {
    id: String(vehicle.id),
    name: `${vehicle.manufacturer} ${vehicle.model}`.trim(),
    category: mapVehicleCategory(vehicle.vehicle_type),
    registration: vehicle.registration_number,
    price: askingPrice,
    buyingPrice,
    askingPrice,
    buyingPriceAmount: vehicle.pricing?.buying_price ?? undefined,
    askingPriceAmount: vehicle.pricing?.price_tag ?? undefined,
    status,
    meta: `${vehicle.year_of_manufacture} · ${formatUsageKm(vehicle.usage_km)} · ${capitalize(vehicle.fuel_type)}`,
    note: formatNote(status, vehicle.current_status?.started_at),
    icon: mapVehicleIcon(vehicle.vehicle_type),
    imageUrl: images[0]?.url,
    imageUrls: images.map((image) => image.url),
    photoCount: images.length,
    owner: '',
    color: vehicle.color ?? '',
    engineNumber: '',
    chassisNumber: '',
    transmission: capitalize(vehicle.transmission_type),
    insuranceValidTill: '',
    expenses: [],
    documents: [],
  };
}

// The detail endpoint's `documents` shape isn't documented yet, so it's left
// unmapped here just like the list mapper above.
function formatFullRupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * One row per document type the app supports, present or not.
 *
 * Built from the slot list rather than from the response keys so a missing
 * document still shows as a gap to fill — a vehicle with no insurance should
 * say so, not silently omit the row.
 */
function mapDocuments(documents: ApiVehicleDetail['documents']): VehicleDocument[] {
  return DOCUMENT_SLOTS.map((slot) => {
    const files = (documents?.[slot.type] ?? []).filter((file) => Boolean(file?.url));

    return {
      type: slot.type,
      label: slot.label,
      status: files.length > 0 ? ('complete' as const) : ('missing' as const),
      count: files.length,
    };
  });
}

function mapSale(selling: ApiVehicleDetail['selling']): VehicleSale | undefined {
  if (!selling || typeof selling.sale_price !== 'number') {
    return undefined;
  }

  const customer = selling.customer ?? {};
  const buyerName = [customer.first_name, customer.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const buyerAddress = [customer.address, customer.city, customer.state, customer.pincode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');

  return {
    soldPrice: formatFullRupees(selling.sale_price),
    soldPriceAmount: selling.sale_price,
    saleDate: formatExpenseDate(selling.sale_date ?? undefined) ?? '',
    // Stored as a snake_case enum ('bank_transfer'), shown as words.
    paymentMode: (selling.payment_mode ?? '').split('_').filter(Boolean).map(capitalize).join(' '),
    buyerName,
    buyerPhone: (customer.phone ?? customer.phone_number ?? '').trim(),
    buyerAddress,
    soldBy: selling.sold_by?.name?.trim() ?? '',
    remarks: selling.remarks?.trim() ?? '',
  };
}

export function mapApiVehicleDetailToItem(detail: ApiVehicleDetail): VehicleItem {
  const basic = detail.basic;
  const status = mapApiStatus(basic.current_status?.status);
  const buyingPrice = formatRupees(detail.buying_details?.buying_price);
  const askingPrice = formatRupees(detail.pricing?.price_tag);
  const images = collectImages(detail.images);
  const photos = collectImagesWithLabels(detail.images);

  return {
    id: String(basic.id),
    name: `${basic.manufacturer} ${basic.model}`.trim(),
    category: mapVehicleCategory(basic.vehicle_type),
    registration: basic.registration_number,
    price: askingPrice,
    buyingPrice,
    askingPrice,
    buyingPriceAmount: detail.buying_details?.buying_price ?? undefined,
    askingPriceAmount: detail.pricing?.price_tag ?? undefined,
    buyingDate: detail.buying_details?.buying_date ?? undefined,
    status,
    meta: `${basic.year_of_manufacture} · ${formatUsageKm(basic.usage_km)} · ${capitalize(basic.fuel_type)}`,
    note: formatNote(status, basic.current_status?.started_at),
    icon: mapVehicleIcon(basic.vehicle_type),
    imageUrl: images[0]?.url,
    imageUrls: images.map((image) => image.url),
    photos: photos.map((image) => ({
      id: image.id,
      url: image.url,
      label: image.label,
    })),
    photoCount: images.length,
    owner: '',
    color: basic.color ?? '',
    engineNumber: '',
    chassisNumber: '',
    transmission: capitalize(basic.transmission_type),
    insuranceValidTill: '',
    expenses: (detail.expenses ?? []).map((expense) => ({
      id: expense.id,
      category: capitalize(expense.type),
      amount: formatExpenseAmount(expense.amount),
      paidTo: expense.paid_to?.trim() || undefined,
      description: expense.description?.trim() || undefined,
      date: formatExpenseDate(expense.date),
    })),
    documents: mapDocuments(detail.documents),
    sale: mapSale(detail.selling),
  };
}
