import {
  GENDER_VALUES,
  NATIONALITY_VALUES,
  PREFERRED_LANGUAGE_VALUES,
} from '@apc/shared';

export interface SelectOption {
  value: string;
  labelKey: string;
}

export const genderOptions: SelectOption[] = GENDER_VALUES.map((value) => ({
  value,
  labelKey: `gender.${value}`,
}));

export const preferredLanguageOptions: SelectOption[] = PREFERRED_LANGUAGE_VALUES.map(
  (value) => ({ value, labelKey: `language.${value}` }),
);

export const nationalityOptions: SelectOption[] = NATIONALITY_VALUES.map((value) => ({
  value,
  labelKey: `nationality.${value}`,
}));

const OPTION_LOOKUP: Record<string, SelectOption[]> = {
  gender: genderOptions,
  preferredLanguage: preferredLanguageOptions,
  nationality: nationalityOptions,
};

/** หา label key ของค่า enum เพื่อแสดงในหน้าเจ้าหน้าที่ */
export function optionLabelKey(field: string, value: string): string | null {
  const options = OPTION_LOOKUP[field];
  if (!options) return null;
  return options.find((option) => option.value === value)?.labelKey ?? null;
}
