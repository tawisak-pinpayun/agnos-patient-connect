import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, total, label, className }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {value}/{total} ({percent}%)
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300',
            percent === 100 ? 'bg-emerald-500' : 'bg-brand-500',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
