import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150",
  {
    variants: {
      variant: {
        default: "border-2 border-foreground bg-foreground text-background",
        secondary: "border-2 border-foreground bg-card text-foreground hover:bg-foreground hover:text-background",
        outline: "border-2 border-foreground bg-card text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
        blue: "bg-category-blue text-background",
        green: "bg-category-green text-background",
        orange: "bg-category-orange text-background",
        yellow: "bg-category-yellow text-foreground",
        purple: "bg-category-purple text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
