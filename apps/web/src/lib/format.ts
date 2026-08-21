import type { Translator } from './i18n';

/** แปลงเวลาเป็นข้อความ "เมื่อสักครู่ / x นาทีที่แล้ว" ตามภาษาที่เลือก */
export function formatRelativeTime(iso: string, t: Translator): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));

  if (seconds < 5) return t('time.justNow');
  if (seconds < 60) return t('time.secondsAgo', { value: seconds });

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('time.minutesAgo', { value: minutes });

  const hours = Math.floor(minutes / 60);
  return t('time.hoursAgo', { value: hours });
}

export function formatDate(iso: string, locale: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age < 0 ? 0 : age;
}
