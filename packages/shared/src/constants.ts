export const GENDER_VALUES = ['male', 'female', 'other', 'undisclosed'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const PREFERRED_LANGUAGE_VALUES = ['th', 'en', 'other'] as const;
export type PreferredLanguage = (typeof PREFERRED_LANGUAGE_VALUES)[number];

export const RELIGION_VALUES = [
  'buddhism',
  'christianity',
  'islam',
  'hinduism',
  'none',
  'other',
] as const;
export type Religion = (typeof RELIGION_VALUES)[number];

export const NATIONALITY_VALUES = [
  'TH',
  'MM',
  'LA',
  'KH',
  'VN',
  'MY',
  'SG',
  'ID',
  'PH',
  'CN',
  'JP',
  'KR',
  'IN',
  'GB',
  'US',
  'AU',
  'DE',
  'FR',
  'RU',
  'OTHER',
] as const;
export type Nationality = (typeof NATIONALITY_VALUES)[number];

/** ระยะเวลาไม่มี activity ที่ถือว่าผู้ป่วยหยุดกรอก */
export const IDLE_THRESHOLD_MS = 30_000;

/** ความถี่ที่ server กวาดหา session ที่ idle */
export const IDLE_SWEEP_INTERVAL_MS = 10_000;

/** debounce ก่อนส่ง draft ขึ้น server */
export const DRAFT_DEBOUNCE_MS = 300;

/** ความถี่ที่ฝั่ง client คำนวณสถานะใหม่เอง */
export const STATUS_RECHECK_INTERVAL_MS = 5_000;
