import clsx from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';

const baseClass =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    const invalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true';
    return (
      <input
        ref={ref}
        className={clsx(
          baseClass,
          invalid
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
          className,
        )}
        {...props}
      />
    );
  },
);
