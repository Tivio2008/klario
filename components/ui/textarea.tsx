import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none',
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
Textarea.displayName = 'Textarea';

export { Textarea };
