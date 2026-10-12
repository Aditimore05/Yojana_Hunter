export type EligibilityStatus = 'eligible' | 'almost' | 'ineligible';

export interface EligibilityCriterion {
  id: string;
  name: string;
  condition: string;
  userValue?: string;
  passed: boolean;
}

export type SchemeStatus = 'draft' | 'published' | 'archived';

export interface Scheme {
  id: string;
  numericId?: number;
  slug?: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  department: string;
  level: string; // e.g. "Central Scheme", "State Scheme"
  state?: string;
  status?: SchemeStatus;
  isActive?: boolean;
  eligibilityStatus: EligibilityStatus;
  matchScore: number; // e.g. 100, 90, 75, 40
  benefit: string; // e.g. "Up to ₹6.5 Lakh", "₹5,000 – ₹20,000"
  benefits?: string;
  ineligibleReason?: string;
  officialUrl: string;
  applicationUrl?: string;
  sourceUrl?: string;
  applicationProcess?: string;
  lastVerifiedDate: string;
  criteria: EligibilityCriterion[];
  requiredDocuments: string[];
  priority?: 'High Priority' | 'Medium Priority' | 'Low Priority';
  ageMin?: number | null;
  ageMax?: number | null;
  incomeMax?: number | null;
  occupation?: string | null;
  education?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

