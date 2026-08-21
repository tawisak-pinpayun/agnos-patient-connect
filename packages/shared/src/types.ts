import type {
  Gender,
  Nationality,
  PreferredLanguage,
} from './constants';

export type SessionStatus = 'filling' | 'submitted' | 'idle';

export interface PatientData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender | '';
  genderOther: string;
  phone: string;
  email: string;
  address: string;
  preferredLanguage: PreferredLanguage | '';
  preferredLanguageOther: string;
  nationality: Nationality | '';
  nationalityOther: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
}

export type PatientDataPatch = Partial<PatientData>;

export type PatientField = keyof PatientData;

export interface SessionSummary {
  sessionId: string;
  status: SessionStatus;
  displayName: string;
  filledCount: number;
  totalCount: number;
  createdAt: string;
  lastActivityAt: string;
  submittedAt: string | null;
  connected: boolean;
}

export interface AuditEntry {
  at: string;
  source: 'patient' | 'staff';
  action: 'draft' | 'submit' | 'delete';
}

export interface SessionSnapshot extends SessionSummary {
  data: PatientData;
  audit: AuditEntry[];
}

export interface FieldError {
  field: string;
  message: string;
}

export const EMPTY_PATIENT_DATA: PatientData = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  genderOther: '',
  phone: '',
  email: '',
  address: '',
  preferredLanguage: '',
  preferredLanguageOther: '',
  nationality: '',
  nationalityOther: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
};

export const PATIENT_FIELDS = Object.keys(EMPTY_PATIENT_DATA) as PatientField[];

export const REQUIRED_PATIENT_FIELDS: PatientField[] = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'phone',
  'email',
  'address',
  'preferredLanguage',
  'nationality',
];

export function countFilledFields(data: Partial<PatientData>): number {
  return REQUIRED_PATIENT_FIELDS.filter(
    (field) => String(data[field] ?? '').trim().length > 0,
  ).length;
}

export function buildDisplayName(data: Partial<PatientData>): string {
  const name = [data.firstName, data.lastName]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
  return name;
}
