import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/ui/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-[16px] font-bold transition-transform duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ink)] text-white hover:bg-[var(--ink)]/90 active:bg-[var(--ink)]/95",
        primary:
          "bg-[var(--ink)] text-white hover:bg-[var(--ink)]/90 active:bg-[var(--ink)]/95",
        owed:
          "bg-[var(--owed)] text-white hover:bg-[var(--owed)]/90 active:bg-[var(--owed)]/95",
        paid:
          "bg-[var(--paid)] text-white hover:bg-[var(--paid)]/90 active:bg-[var(--paid)]/95",
        outline:
          "border border-[var(--rule)] bg-transparent text-[var(--ink)] hover:bg-[var(--paper)] active:bg-[var(--rule)]/30",
        secondary:
          "bg-[var(--paper)] text-[var(--ink)] border border-[var(--rule)] hover:bg-[var(--sheet)]",
        text:
          "bg-transparent text-[var(--ink)] hover:bg-[var(--paper)] active:bg-[var(--paper)]",
        ghost:
          "bg-transparent text-[var(--ink)] hover:bg-[var(--paper)] active:bg-[var(--paper)]",
        link:
          "bg-transparent text-[var(--ink)] underline-offset-4 hover:underline p-0 min-h-0",
        alert:
          "bg-[var(--alert-wash)] text-[var(--alert-ink)] border border-[var(--alert-ink)]/30 hover:bg-[var(--alert-wash)]/80",
      },
      size: {
        default: "min-h-[48px] px-4 py-2.5 rounded-[var(--radius-control)]",
        sm: "min-h-[48px] px-3 py-2 text-[14px] rounded-[var(--radius-control)]",
        lg: "min-h-[56px] px-6 py-3 text-[18px] rounded-[var(--radius-control)]",
        save: "min-h-[56px] h-14 px-6 text-[18px] font-bold w-full rounded-[var(--radius-control)]",
        chip: "min-h-[44px] h-11 px-3.5 py-1.5 text-[14px] font-bold rounded-[var(--radius-chip)]",
        icon: "min-h-[48px] min-w-[48px] h-12 w-12 rounded-[var(--radius-control)] p-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
