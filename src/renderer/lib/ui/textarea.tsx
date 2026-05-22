import * as React from 'react';
import { cn } from '@renderer/utils/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-md border border-border bg-transparent px-2.5 py-2 text-sm transition-all duration-fast ease-out outline-none placeholder:text-foreground-passive hover:border-border-1 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        className
      )}
      {...props}
    />
  );
}

export type TextareaProps = React.ComponentProps<'textarea'>;

export { Textarea };
