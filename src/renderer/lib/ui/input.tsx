import { Input as InputPrimitive } from '@base-ui/react/input';
import * as React from 'react';
import { cn } from '@renderer/utils/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full min-w-0 rounded-md border border-border bg-transparent px-2.5 py-1 text-sm transition-all duration-fast ease-out outline-none placeholder:text-foreground-passive hover:border-border-1 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        className
      )}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.currentTarget.blur();
        }
      }}
      {...props}
    />
  );
}

export { Input };
