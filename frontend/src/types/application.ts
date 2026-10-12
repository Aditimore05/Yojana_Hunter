export interface ActionPlanStep {
  stepNumber: number;
  title: string;
  description?: string;
  statusText?: string;
  actionLabel: string;
  actionUrl?: string;
  badgeType?: 'success' | 'alert' | 'neutral';
  badgeText?: string;
  isCompleted?: boolean;
}

export interface ApplicationDraft {
  id: string;
  schemeId: string;
  schemeName: string;
  applicantName: string;
  fatherName: string;
  dateOfBirth: string;
  education: string;
  familyIncome: string;
  state: string;
  district: string;
  status: 'draft' | 'submitted' | 'approved';
  createdAt: string;
}
