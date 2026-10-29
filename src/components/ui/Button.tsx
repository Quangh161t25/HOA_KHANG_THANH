import { forwardRef, memo, type ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};
const SIZES = { default: 'h-10 px-4 py-2', sm: 'h-9 rounded-md px-3', lg: 'h-11 rounded-md px-8', icon: 'h-10 w-10' };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  isLoading?: boolean;
}

export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', isLoading = false, children, disabled, ...props }, ref) => (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    ),
  ),
);
Button.displayName = 'Button';
