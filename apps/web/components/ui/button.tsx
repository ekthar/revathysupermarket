import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-elevation-2 hover:bg-primary/90",
        secondary: "bg-lime-fresh text-slate-950 shadow-elevation-2 hover:bg-lime-fresh/85",
        outline: "border border-border bg-background/90 shadow-sm hover:bg-muted",
        ghost: "hover:bg-muted",
        dark: "bg-slate-950 text-white hover:bg-slate-800",
        destructive: "bg-red-600 text-white shadow-elevation-2 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3",
        lg: "h-12 px-7 text-base sm:h-14",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button' as React.ButtonHTMLAttributes<HTMLButtonElement>['type'], asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp type={type} className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
