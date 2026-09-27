import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type VehicleFilter = 'All' | 'Cars' | 'Bikes' | 'Scooty';

// Mirrors the API's `current_status.status` vocabulary
// ('garage' | 'inspection' | 'ready_for_sale' | 'sold') so a vehicle sitting
// in the garage is not mislabelled as being repaired.
export type VehicleStatus = 'Available' | 'Sold' | 'In Garage' | 'Inspection';

export type VehicleCategory = Exclude<VehicleFilter, 'All'>;

export type VehicleStatusFilter = 'All' | VehicleStatus;

export type VehiclePhotoItem = {
  id?: number;
  url: string;
  /** API section key — front | back | interior | exterior | wheel | … */
  label: string;
};

export type VehicleItem = {
  id: string;
  name: string;
  category: VehicleCategory;
  registration: string;
  price: string;
  buyingPrice: string;
  askingPrice: string;
  /** Raw buying_price from the API — used for inline price edits. */
  buyingPriceAmount?: number;
  /** Raw price_tag, for places that need to format or compare it themselves. */
  askingPriceAmount?: number;
  /** ISO buying_date from the API — required when patching pricing. */
  buyingDate?: string;
  status: VehicleStatus;
  meta: string;
  note: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  /** Primary photo. Signed URL from the API — expires roughly an hour after it is issued. */
  imageUrl?: string;
  imageUrls?: string[];
  /**
   * All photos with their API section label (front/back/…). A single label can
   * hold more than one image — the detail gallery groups and pages by this.
   */
  photos?: VehiclePhotoItem[];
  owner: string;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  transmission: string;
  insuranceValidTill: string;
  photoCount?: number;
  expenses: VehicleExpense[];
  documents: VehicleDocument[];
  /** Present only once the vehicle has been sold. */
  sale?: VehicleSale;
};

export type VehicleExpense = {
  id: number;
  /** The expense type, title-cased for display — "Repair", "Insurance". */
  category: string;
  amount: string;
  paidTo?: string;
  description?: string;
  date?: string;
};

/**
 * What a vehicle actually sold for, from the detail endpoint's `selling`
 * section. Absent until the vehicle is sold.
 *
 * `soldPrice` is the negotiated price the buyer paid — distinct from
 * `askingPrice`, which is only what the vehicle was tagged at.
 */
export type VehicleSale = {
  soldPrice: string;
  soldPriceAmount: number;
  saleDate: string;
  paymentMode: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  soldBy: string;
  remarks: string;
};

export type VehicleDocument = {
  /** The server's document_type, so a row can link straight to its slot. */
  type: string;
  label: string;
  status: 'complete' | 'missing';
  /** How many files are stored for this type — a document can have several pages. */
  count: number;
};

export type VehicleCategoryTab = {
  label: string;
  value: VehicleCategory;
  count: number;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export type VehicleStat = {
  value: string;
  label: string;
  tone: 'default' | 'success' | 'danger' | 'primary';
};
