'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  EMPTY_PATIENT_DATA,
  countFilledFields,
  patientSchema,
  REQUIRED_PATIENT_FIELDS,
  type PatientData,
  type PatientField,
} from '@apc/shared';
import { FormField } from './FormField';
import { FormSection } from './FormSection';
import { SubmitBar } from './SubmitBar';
import { SuccessPanel } from './SuccessPanel';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { usePatientDraftSync } from '@/hooks/usePatientDraftSync';
import { useTranslation } from '@/hooks/useTranslation';
import { calculateAge } from '@/lib/format';
import {
  genderOptions,
  nationalityOptions,
  preferredLanguageOptions,
  type SelectOption,
} from '@/lib/options';

interface PatientFormProps {
  sessionId: string;
}

export function PatientForm({ sessionId }: PatientFormProps) {
  const { t } = useTranslation();
  const { snapshot, syncState, submittedAt, pushPatch, submit } =
    usePatientDraftSync(sessionId);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const hydrated = useRef(false);

  const form = useForm<PatientData>({
    resolver: zodResolver(patientSchema),
    defaultValues: EMPTY_PATIENT_DATA,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  // hydrate ครั้งเดียวจาก draft ที่เก็บไว้ใน MongoDB
  useEffect(() => {
    if (!snapshot || hydrated.current) return;
    hydrated.current = true;
    reset({ ...EMPTY_PATIENT_DATA, ...snapshot.data });
  }, [reset, snapshot]);

  // ส่งเฉพาะ field ที่เปลี่ยนขึ้น server (debounce ทำใน hook)
  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (!name) return;
      const field = name as PatientField;
      pushPatch({ [field]: values[field] ?? '' } as Partial<PatientData>);
    });
    return () => subscription.unsubscribe();
  }, [pushPatch, watch]);

  const values = watch();
  const age = useMemo(() => calculateAge(values.dateOfBirth), [values.dateOfBirth]);
  const filledCount = countFilledFields(values);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    const result = await submit(data);

    if (!result.ok) {
      if (result.errors?.length) {
        for (const issue of result.errors) {
          setError(issue.field as PatientField, { message: issue.message });
        }
      } else {
        setSubmitError('patient.submitError');
      }
    }
  });

  if (submittedAt) {
    return <SuccessPanel data={values} submittedAt={submittedAt} />;
  }

  const renderOptions = (options: SelectOption[]) => (
    <>
      <option value="">{t('field.selectPlaceholder')}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {t(option.labelKey)}
        </option>
      ))}
    </>
  );

  return (
    <form onSubmit={onSubmit} noValidate autoComplete="off" className="space-y-4 pb-28 lg:pb-4">
      <FormSection titleKey="patient.section.personal">
        <FormField id="firstName" labelKey="field.firstName" required error={errors.firstName?.message}>
          <Input
            id="firstName"
            autoComplete="off"
            aria-invalid={Boolean(errors.firstName)}
            {...register('firstName')}
          />
        </FormField>

        <FormField id="middleName" labelKey="field.middleName" error={errors.middleName?.message}>
          <Input
            id="middleName"
            autoComplete="off"
            aria-invalid={Boolean(errors.middleName)}
            {...register('middleName')}
          />
        </FormField>

        <FormField id="lastName" labelKey="field.lastName" required error={errors.lastName?.message}>
          <Input
            id="lastName"
            autoComplete="off"
            aria-invalid={Boolean(errors.lastName)}
            {...register('lastName')}
          />
        </FormField>

        <FormField id="dateOfBirth" labelKey="field.dateOfBirth" required error={errors.dateOfBirth?.message} hint={age ? t('field.age', { value: age }) : undefined}>
          <Input
            id="dateOfBirth"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            aria-invalid={Boolean(errors.dateOfBirth)}
            {...register('dateOfBirth')}
          />
        </FormField>

        <FormField id="gender" labelKey="field.gender" required error={errors.gender?.message}>
          <Select id="gender" aria-invalid={Boolean(errors.gender)} {...register('gender')}>
            {renderOptions(genderOptions)}
          </Select>
        </FormField>

        <FormField id="nationality" labelKey="field.nationality" required error={errors.nationality?.message}>
          <Select
            id="nationality"
            aria-invalid={Boolean(errors.nationality)}
            {...register('nationality')}
          >
            {renderOptions(nationalityOptions)}
          </Select>
        </FormField>

        {values.nationality === 'OTHER' && (
          <FormField
            id="nationalityOther"
            labelKey="field.nationalityOther"
            required
            error={errors.nationalityOther?.message}
          >
            <Input id="nationalityOther" aria-invalid={Boolean(errors.nationalityOther)} {...register('nationalityOther')} />
          </FormField>
        )}

      </FormSection>

      <FormSection titleKey="patient.section.contact">
        <FormField
          id="phone"
          labelKey="field.phone"
          required
          error={errors.phone?.message}
          hint={t('field.phoneHint')}
        >
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </FormField>

        <FormField id="email" labelKey="field.email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </FormField>

        <FormField
          id="address"
          labelKey="field.address"
          required
          error={errors.address?.message}
          className="sm:col-span-2"
        >
          <Textarea
            id="address"
            autoComplete="off"
            placeholder={t('field.addressPlaceholder')}
            aria-invalid={Boolean(errors.address)}
            {...register('address')}
          />
        </FormField>

        <FormField
          id="preferredLanguage"
          labelKey="field.preferredLanguage"
          required
          error={errors.preferredLanguage?.message}
        >
          <Select
            id="preferredLanguage"
            aria-invalid={Boolean(errors.preferredLanguage)}
            {...register('preferredLanguage')}
          >
            {renderOptions(preferredLanguageOptions)}
          </Select>
        </FormField>

        {values.preferredLanguage === 'other' && (
          <FormField
            id="preferredLanguageOther"
            labelKey="field.preferredLanguageOther"
            required
            error={errors.preferredLanguageOther?.message}
          >
            <Input id="preferredLanguageOther" aria-invalid={Boolean(errors.preferredLanguageOther)} {...register('preferredLanguageOther')} />
          </FormField>
        )}
      </FormSection>

      <FormSection titleKey="patient.section.extra">
        <FormField
          id="emergencyContactName"
          labelKey="field.emergencyContactName"
          error={errors.emergencyContactName?.message}
        >
          <Input
            id="emergencyContactName"
            aria-invalid={Boolean(errors.emergencyContactName)}
            {...register('emergencyContactName')}
          />
        </FormField>

        <FormField
          id="emergencyContactRelation"
          labelKey="field.emergencyContactRelation"
          error={errors.emergencyContactRelation?.message}
        >
          <Input
            id="emergencyContactRelation"
            aria-invalid={Boolean(errors.emergencyContactRelation)}
            {...register('emergencyContactRelation')}
          />
        </FormField>

      </FormSection>

      <SubmitBar
        filledCount={filledCount}
        totalCount={REQUIRED_PATIENT_FIELDS.length}
        syncState={syncState}
        isSubmitting={isSubmitting}
        errorKey={submitError}
      />
    </form>
  );
}
