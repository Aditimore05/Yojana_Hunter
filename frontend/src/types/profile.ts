export interface UserLevelInfo {
  level: number;
  levelName: string;
  score: number;
  maxScore: number;
  nextLevel: number;
  nextThreshold: number;
  pointsToNext: number;
  badgeColor: string;
  progressPercent: number;
  breakdown: {
    profilePoints: number;
    activityPoints: number;
    savedSchemesPoints: number;
    applicationPoints: number;
  };
}

export interface UserActivity {
  id: string;
  action: string;
  title: string;
  type: string;
  category?: string;
  timestamp: string | null;
  timeAgo: string;
  details?: Record<string, any>;
}

export type FamilyRelationship = 'Self' | 'Father' | 'Mother' | 'Child' | 'Spouse' | 'Other';

export interface UserProfile {
  id?: number;
  userId?: number;
  user_id?: number;
  relationship?: FamilyRelationship | string;
  name: string;
  fullName?: string;
  full_name?: string;
  avatarUrl?: string;
  occupation: string;
  age: number;
  gender?: string;
  state: string;
  district: string;
  annualIncome: string; // e.g. "< 1 Lakh"
  incomeNumeric?: number;
  education: string;
  category: string; // e.g. "General", "OBC", "SC", "ST", "EWS"
  socialCategory?: string;
  fatherName?: string;
  dateOfBirth?: string;
  completenessPercent: number;
  isProfileSaved?: boolean;
  is_profile_saved?: boolean;
  userLevel?: UserLevelInfo;
  language: 'en' | 'hi' | 'mr';
  isFarmer?: boolean;
  landHoldingAcres?: number;
  landholdingAcres?: number;
  isStudent?: boolean;
  course?: string;
  institution?: string;
  hasBusiness?: boolean;
  businessType?: string;
  isDisabled?: boolean;
  hasDisability?: boolean;
  disabilityType?: string;
  isTaxPayer?: boolean;
  isGovtEmployee?: boolean;
  employmentStatus?: string;
}

export interface InterviewQuestion {
  id: string;
  field: keyof UserProfile;
  prompt: {
    en: string;
    hi: string;
    mr: string;
  };
  options?: {
    label: { en: string; hi: string; mr: string };
    value: string;
  }[];
  inputType?: 'quick-reply' | 'text' | 'number';
}
