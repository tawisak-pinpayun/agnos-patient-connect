import type {
  Gender,
  Nationality,
  PreferredLanguage,
  Religion,
} from './constants';

export type SessionStatus = 'filling' | 'submitted' | 'idle';

export interface PatientData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender | '';
  phone: string;
  email: string;
  address: string;
  preferredLanguage: PreferredLanguage | '';
  nationality: Nationality | '';
  emergencyContactName: string;
  emergencyContactRelation: string;
  religion: Religion | '';
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

export interface SessionSnapshot extends SessionSummary {
  data: PatientData;
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
  phone: '',
  email: '',
  address: '',
  preferredLanguage: '',
  nationality: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  religion: '',
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
