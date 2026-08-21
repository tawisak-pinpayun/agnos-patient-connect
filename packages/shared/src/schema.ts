import { z } from 'zod';
import {
  GENDER_VALUES,
  NATIONALITY_VALUES,
  PREFERRED_LANGUAGE_VALUES,
} from './constants';

/**
 * ข้อความ error เก็บเป็น "key" เพื่อให้ฝั่ง UI แปลเป็นไทย/อังกฤษได้
 * ดู dictionary ที่ apps/web/src/lib/i18n
 */
export const ERROR_KEYS = {
  required: 'error.required',
  tooLong: 'error.tooLong',
  nameTooLong: 'error.nameTooLong',
  invalidDate: 'error.invalidDate',
  futureDate: 'error.futureDate',
  ageTooOld: 'error.ageTooOld',
  invalidGender: 'error.invalidGender',
  invalidPhone: 'error.invalidPhone',
  invalidEmail: 'error.invalidEmail',
  addressTooShort: 'error.addressTooShort',
  addressTooLong: 'error.addressTooLong',
  invalidLanguage: 'error.invalidLanguage',
  invalidNationality: 'error.invalidNationality',
  specifyOther: 'error.specifyOther',
  emergencyIncomplete: 'error.emergencyIncomplete',
} as const;

const PHONE_PATTERN = /^\+?[\d\s-]{9,20}$/;
const MAX_AGE_YEARS = 120;

const optionalText = (max = 100) =>
  z
    .string()
    .trim()
    .max(max, ERROR_KEYS.tooLong)
    .optional()
    .default('');

const requiredName = z
  .string()
  .trim()
  .min(1, ERROR_KEYS.required)
  .max(100, ERROR_KEYS.nameTooLong);

const dateOfBirth = z
  .string()
  .trim()
  .min(1, ERROR_KEYS.required)
  .refine((value) => !Number.isNaN(Date.parse(value)), ERROR_KEYS.invalidDate)
  .refine((value) => new Date(value).getTime() <= Date.now(), ERROR_KEYS.futureDate)
  .refine((value) => {
    const oldest = new Date();
    oldest.setFullYear(oldest.getFullYear() - MAX_AGE_YEARS);
    return new Date(value).getTime() >= oldest.getTime();
  }, ERROR_KEYS.ageTooOld);

const phone = z
  .string()
  .trim()
  .min(1, ERROR_KEYS.required)
  .regex(PHONE_PATTERN, ERROR_KEYS.invalidPhone)
  .refine((value) => value.replace(/\D/g, '').length >= 9, ERROR_KEYS.invalidPhone)
  .refine((value) => value.replace(/\D/g, '').length <= 15, ERROR_KEYS.invalidPhone);

const email = z
  .string()
  .trim()
  .min(1, ERROR_KEYS.required)
  .email(ERROR_KEYS.invalidEmail)
  .max(254, ERROR_KEYS.tooLong);

const address = z
  .string()
  .trim()
  .min(1, ERROR_KEYS.required)
  .min(5, ERROR_KEYS.addressTooShort)
  .max(300, ERROR_KEYS.addressTooLong);

/** schema เต็มสำหรับตอน submit */
export const patientSchema = z
  .object({
    firstName: requiredName,
    middleName: optionalText(100),
    lastName: requiredName,
    dateOfBirth,
    gender: z.enum(GENDER_VALUES, {
      errorMap: () => ({ message: ERROR_KEYS.required }),
    }),
    genderOther: optionalText(100),
    phone,
    email,
    address,
    preferredLanguage: z.enum(PREFERRED_LANGUAGE_VALUES, {
      errorMap: () => ({ message: ERROR_KEYS.required }),
    }),
    preferredLanguageOther: optionalText(100),
    nationality: z.enum(NATIONALITY_VALUES, {
      errorMap: () => ({ message: ERROR_KEYS.required }),
    }),
    nationalityOther: optionalText(100),
    emergencyContactName: optionalText(100),
    emergencyContactRelation: optionalText(60),
  })
  .superRefine((value, ctx) => {
    if (value.nationality === 'OTHER' && value.nationalityOther.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_KEYS.specifyOther,
        path: ['nationalityOther'],
      });
    }
    if (value.preferredLanguage === 'other' && value.preferredLanguageOther.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_KEYS.specifyOther,
        path: ['preferredLanguageOther'],
      });
    }
    const hasName = value.emergencyContactName.trim().length > 0;
    const hasRelation = value.emergencyContactRelation.trim().length > 0;
    if (hasName !== hasRelation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_KEYS.emergencyIncomplete,
        path: [hasName ? 'emergencyContactRelation' : 'emergencyContactName'],
      });
    }
  });

export type PatientSchemaInput = z.input<typeof patientSchema>;
export type PatientSchemaOutput = z.output<typeof patientSchema>;

/** schema แบบหลวมสำหรับ draft ที่ยังกรอกไม่เสร็จ (ใช้ตรวจ patch ที่ส่งเข้ามา) */
export const patientDraftSchema = z
  .object({
    firstName: z.string().max(100),
    middleName: z.string().max(100),
    lastName: z.string().max(100),
    dateOfBirth: z.string().max(30),
    gender: z.union([z.enum(GENDER_VALUES), z.literal('')]),
    genderOther: z.string().max(100),
    phone: z.string().max(30),
    email: z.string().max(254),
    address: z.string().max(300),
    preferredLanguage: z.union([z.enum(PREFERRED_LANGUAGE_VALUES), z.literal('')]),
    preferredLanguageOther: z.string().max(100),
    nationality: z.union([z.enum(NATIONALITY_VALUES), z.literal('')]),
    nationalityOther: z.string().max(100),
    emergencyContactName: z.string().max(100),
    emergencyContactRelation: z.string().max(60),
  })
  .partial();

export type PatientDraftPatch = z.infer<typeof patientDraftSchema>;

export const sessionIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{6,64}$/);
