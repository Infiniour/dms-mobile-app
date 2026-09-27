/**
 * The document slots shown on the Documents screen.
 *
 * These are exactly the values the server accepts — see
 * isValidVehicleDocumentType in internal/modules/vehicle/service.go. Anything
 * outside this list is rejected as an invalid request, so nothing else is
 * offered here.
 */
export type DocumentType = 'registration_certificate' | 'insurance' | 'pollution';

export type DocumentSlot = {
  type: DocumentType;
  label: string;
  hint: string;
};

export const DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    type: 'registration_certificate',
    label: 'RC Book',
    hint: 'Both sides, or the full PDF',
  },
  {
    type: 'insurance',
    label: 'Insurance',
    hint: 'Policy document, all pages',
  },
  {
    type: 'pollution',
    label: 'PUC Certificate',
    hint: 'Pollution under control certificate',
  },
];

/** Matches allowedVehicleDocumentExtensions / maxVehicleDocumentSize on the server. */
export const DOCUMENT_RULES = {
  maxBytes: 15 * 1024 * 1024,
  maxLabel: '15MB',
  accepted: 'JPG, PNG, PDF',
  mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
};

/**
 * One page of a document. A document is a list of these, because an RC book is
 * two photos and an insurance policy is a multi-page PDF — the server models it
 * the same way, returning `documents` as type -> array of files.
 */
export type DocumentFile = {
  id: string;
  uri: string;
  name: string;
  kind: 'pdf' | 'image';
  size?: number;
  /**
   * Set for files already stored on the vehicle. The API has no delete-document
   * endpoint, so these can be viewed but never removed from the app.
   */
  remoteId?: number;
};

export function kindFromSource(source: string, mimeType?: string): DocumentFile['kind'] {
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }

  return source.split('?')[0].toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
}
