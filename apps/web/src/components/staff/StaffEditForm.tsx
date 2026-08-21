'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  DRAFT_DEBOUNCE_MS,
  REQUIRED_PATIENT_FIELDS,
  SOCKET_EVENTS,
  type Ack,
  type PatientData,
  type PatientField,
} from '@apc/shared';
import { FormField } from '@/components/patient/FormField';
import { FormSection } from '@/components/patient/FormSection';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useSocket } from '@/hooks/useSocket';
import { useTranslation } from '@/hooks/useTranslation';
import { calculateAge } from '@/lib/format';
import {
  genderOptions,
  nationalityOptions,
  preferredLanguageOptions,
  type SelectOption,
} from '@/lib/options';

type SyncState = 'idle' | 'saving' | 'saved' | 'error';

export interface StaffEditFormProps {
  sessionId: string;
  initialData: PatientData;
  onClose: () => void;
}

function SyncStatus({ state }: { state: SyncState }) {
  const { t } = useTranslation();
  if (state === 'saving') {
    return <span className="text-xs text-slate-500">{t('patient.saving')}</span>;
  }
  if (state === 'saved') {
    return <span className="text-xs text-emerald-600">{t('patient.saved')}</span>;
  }
  if (state === 'error') {
    return <span className="text-xs text-rose-600">{t('connection.disconnected')}</span>;
  }
  return null;
}

export function StaffEditForm({ sessionId, initialData, onClose }: StaffEditFormProps) {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const form = useForm<PatientData>({
    defaultValues: initialData,
    mode: 'onBlur',
  });
  const { register, watch } = form;
  const values = watch();
  const age = useMemo(() => calculateAge(values.dateOfBirth), [values.dateOfBirth]);

  const pendingPatch = useRef<Partial<PatientData>>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (Object.keys(pendingPatch.current).length === 0) return;
    const patch = pendingPatch.current;
    pendingPatch.current = {};
    setSyncState('saving');
    socket.emit(
      SOCKET_EVENTS.draftUpdate,
      { sessionId, patch },
      (res: Ack) => {
        if (res?.ok) {
          setSyncState('saved');
        } else {
          setSyncState('error');
          pendingPatch.current = { ...patch, ...pendingPatch.current };
        }
      },
    );
  }, [sessionId, socket]);

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (!name) return;
      const field = name as PatientField;
      const value = (values[field] ?? '') as string;
      pendingPatch.current = { ...pendingPatch.current, [field]: value };
      setSyncState('saving');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(flush, DRAFT_DEBOUNCE_MS);
    });
    return () => subscription.unsubscribe();
  }, [watch, flush]);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      flush();
    },
    [flush],
  );

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

  const isRequired = (field: PatientField) => REQUIRED_PATIENT_FIELDS.includes(field);

  return (
    <form noValidate autoComplete="off" className="space-y-4">
      <p className="text-xs text-slate-500">{t('staff.editHint')}</p>

      <FormSection titleKey="patient.section.personal">
        <FormField
          id="firstName"
          labelKey="field.firstName"
          required={isRequired('firstName')}
        >
          <Input id="firstName" autoComplete="off" {...register('firstName')} />
        </FormField>

        <FormField id="middleName" labelKey="field.middleName">
          <Input id="middleName" autoComplete="off" {...register('middleName')} />
        </FormField>

        <FormField id="lastName" labelKey="field.lastName" required={isRequired('lastName')}>
          <Input id="lastName" autoComplete="off" {...register('lastName')} />
        </FormField>

        <FormField id="dateOfBirth" labelKey="field.dateOfBirth" required={isRequired('dateOfBirth')} hint={age ? t('field.age', { value: age }) : undefined}>
          <Input id="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} {...register('dateOfBirth')} />
        </FormField>

        <FormField id="gender" labelKey="field.gender" required={isRequired('gender')}>
          <Select id="gender" {...register('gender')}>{renderOptions(genderOptions)}</Select>
        </FormField>

        <FormField id="nationality" labelKey="field.nationality" required={isRequired('nationality')}>
          <Select id="nationality" {...register('nationality')}>{renderOptions(nationalityOptions)}</Select>
        </FormField>

        {values.nationality === 'OTHER' && (
          <FormField id="nationalityOther" labelKey="field.nationalityOther" required>
            <Input id="nationalityOther" {...register('nationalityOther')} />
          </FormField>
        )}
      </FormSection>

      <FormSection titleKey="patient.section.contact">
        <FormField id="phone" labelKey="field.phone" required={isRequired('phone')}>
          <Input id="phone" type="tel" inputMode="tel" autoComplete="off" {...register('phone')} />
        </FormField>

        <FormField id="email" labelKey="field.email" required={isRequired('email')}>
          <Input id="email" type="email" inputMode="email" autoComplete="off" {...register('email')} />
        </FormField>

        <FormField
          id="address"
          labelKey="field.address"
          required={isRequired('address')}
          className="sm:col-span-2"
        >
          <Textarea
            id="address"
            autoComplete="off"
            placeholder={t('field.addressPlaceholder')}
            {...register('address')}
          />
        </FormField>

        <FormField id="preferredLanguage" labelKey="field.preferredLanguage" required={isRequired('preferredLanguage')}>
          <Select id="preferredLanguage" {...register('preferredLanguage')}>
            {renderOptions(preferredLanguageOptions)}
          </Select>
        </FormField>

        {values.preferredLanguage === 'other' && (
          <FormField id="preferredLanguageOther" labelKey="field.preferredLanguageOther" required>
            <Input id="preferredLanguageOther" {...register('preferredLanguageOther')} />
          </FormField>
        )}
      </FormSection>

      <FormSection titleKey="patient.section.extra">
        <FormField id="emergencyContactName" labelKey="field.emergencyContactName">
          <Input id="emergencyContactName" {...register('emergencyContactName')} />
        </FormField>

        <FormField id="emergencyContactRelation" labelKey="field.emergencyContactRelation">
          <Input id="emergencyContactRelation" {...register('emergencyContactRelation')} />
        </FormField>
      </FormSection>

      <div className="flex items-center justify-between gap-2">
        <SyncStatus state={syncState} />
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('staff.cancel')}
        </Button>
      </div>
    </form>
  );
}
