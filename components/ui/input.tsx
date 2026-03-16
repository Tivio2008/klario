import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-[var(--destructive)]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
