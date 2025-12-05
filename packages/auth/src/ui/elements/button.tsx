import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "tern:inline-flex tern:items-center tern:justify-center tern:gap-2 tern:whitespace-nowrap tern:rounded-md tern:text-sm tern:font-medium tern:transition-all disabled:tern:pointer-events-none disabled:tern:opacity-50 [&_svg]:tern:pointer-events-none [&_svg:not([class*='size-'])]:tern:size-4 tern:shrink-0 [&_svg]:tern:shrink-0 tern:outline-none focus-visible:tern:border-ring focus-visible:tern:ring-ring/50 focus-visible:tern:ring-[3px] aria-invalid:tern:ring-destructive/20 dark:aria-invalid:tern:ring-destructive/40 aria-invalid:tern:border-destructive",
  {
    variants: {
      variant: {
        default:
          "tern:bg-primary tern:text-primary-foreground tern:shadow-xs hover:tern:bg-primary/90",
        destructive:
          "tern:bg-destructive tern:text-white tern:shadow-xs hover:tern:bg-destructive/90 focus-visible:tern:ring-destructive/20 dark:focus-visible:tern:ring-destructive/40 dark:tern:bg-destructive/60",
        outline:
          "tern:border tern:bg-background tern:shadow-xs hover:tern:bg-accent hover:tern:text-accent-foreground dark:tern:bg-input/30 dark:tern:border-input dark:hover:tern:bg-input/50",
        secondary:
          "tern:bg-secondary tern:text-secondary-foreground tern:shadow-xs hover:tern:bg-secondary/80",
        ghost:
          "hover:tern:bg-accent hover:tern:text-accent-foreground dark:hover:tern:bg-accent/50",
        link: "tern:text-primary tern:underline-offset-4 hover:tern:underline",
      },
      size: {
        default: "tern:h-9 tern:px-4 tern:py-2 has-[>svg]:tern:px-3",
        sm: "tern:h-8 tern:rounded-md tern:gap-1.5 tern:px-3 has-[>svg]:tern:px-2.5",
        lg: "tern:h-10 tern:rounded-md tern:px-6 has-[>svg]:tern:px-4",
        icon: "tern:size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }