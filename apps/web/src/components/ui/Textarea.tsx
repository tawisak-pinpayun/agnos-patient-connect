import clsx from 'clsx';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  const invalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true';
  return (
    <textarea
      ref={ref}
      rows={3}
      className={clsx(
        'w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2',
        invalid
          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
        className,
      )}
      {...props}
    />
  );
});
