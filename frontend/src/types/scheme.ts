export type EligibilityStatus = 'eligible' | 'almost' | 'ineligible';

export interface EligibilityCriterion {
  id: string;
  name: string;
  condition: string;
  userValue?: string;
  passed: boolean;
}

export interface Scheme {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  department: string;
  level: string; // e.g. "Central Scheme", "State Scheme"
  eligibilityStatus: EligibilityStatus;
  matchScore: number; // e.g. 100, 90, 75, 40
  benefit: string; // e.g. "Up to ₹6.5 Lakh", "₹5,000 – ₹20,000"
  ineligibleReason?: string;
  officialUrl: string;
  lastVerifiedDate: string;
  criteria: EligibilityCriterion[];
  requiredDocuments: string[];
  priority?: 'High Priority' | 'Medium Priority' | 'Low Priority';
}
