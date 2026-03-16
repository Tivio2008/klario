import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--primary)] text-white',
    secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
    destructive: 'bg-[var(--destructive)]/20 text-[var(--destructive)]',
    outline: 'border border-[var(--border)] text-[var(--foreground)]',
    success: 'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
