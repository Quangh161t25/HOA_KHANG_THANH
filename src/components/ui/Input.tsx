import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label?: ReactNode;
  error?: string;
  icon?: ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  ({ className, type, label, error, icon, required, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5"
          >
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            {label}
            {required && (
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              'flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-destructive focus-visible:ring-destructive' : '',
              className,
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-destructive mt-1">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(
  ({ className, label, error, required, icon, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 flex items-center gap-1.5 text-foreground"
          >
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            {label}
            {required && (
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            'flex min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground transition-colors resize-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive focus-visible:ring-destructive' : '',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-destructive mt-1.5 ml-1">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
