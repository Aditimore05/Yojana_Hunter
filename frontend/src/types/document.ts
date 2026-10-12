export type DocumentStatus = 'uploaded' | 'missing' | 'pending';

export interface CitizenDocument {
  id: string;
  name: string;
  type: string;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  isRequiredFor: string[]; // scheme ids or scheme names
}

export interface DocumentReadinessStats {
  readyPercent: number;
  uploadedCount: number;
  missingCount: number;
  totalCount: number;
}
