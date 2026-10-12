export interface UserProfile {
  name: string;
  avatarUrl?: string;
  occupation: string;
  age: number;
  gender?: string;
  state: string;
  district: string;
  annualIncome: string; // e.g. "< 1 Lakh"
  incomeNumeric?: number;
  education: string;
  category: string; // e.g. "General", "OBC", "SC", "ST"
  fatherName?: string;
  dateOfBirth?: string;
  completenessPercent: number;
  language: 'en' | 'hi' | 'mr';
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
