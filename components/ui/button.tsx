import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.99]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-primary text-brand-primary-fg shadow-sm hover:bg-brand-primary-hover",
        accent:
          "bg-brand-accent text-brand-accent-fg shadow-sm hover:bg-brand-accent-hover",
        secondary:
          "bg-brand-secondary text-brand-secondary-fg hover:bg-brand-secondary/80",
        outline:
          "border border-brand-border-strong bg-brand-surface text-brand-text hover:bg-brand-surface-muted",
        ghost:
          "text-brand-text hover:bg-brand-surface-muted",
        danger:
          "bg-brand-error text-white hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3.5 text-xs rounded-lg",
        md: "h-10.5 px-4.5 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
