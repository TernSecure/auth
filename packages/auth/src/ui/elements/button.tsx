import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "tern:inline-flex tern:items-center tern:justify-center tern:gap-2 tern:whitespace-nowrap tern:rounded-md tern:text-sm tern:font-medium tern:transition-all tern:disabled:pointer-events-none tern:disabled:opacity-50 tern:[&_svg]:pointer-events-none tern:[&_svg:not([class*=size-])]:size-4 tern:shrink-0 tern:[&_svg]:shrink-0 tern:outline-none tern:focus-visible:border-ring tern:focus-visible:ring-ring/50 tern:focus-visible:ring-[3px] tern:aria-invalid:ring-destructive/20 tern:dark:aria-invalid:ring-destructive/40 tern:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "tern:bg-primary tern:text-primary-foreground tern:hover:bg-primary/90",
        destructive:
          "tern:bg-destructive tern:text-white tern:hover:bg-destructive/90 tern:focus-visible:ring-destructive/20 tern:dark:focus-visible:ring-destructive/40 tern:dark:bg-destructive/60",
        outline:
          "tern:border tern:bg-background tern:shadow-xs tern:hover:bg-accent tern:hover:text-accent-foreground tern:dark:bg-input/30 tern:dark:border-input tern:dark:hover:bg-input/50",
        secondary:
          "tern:bg-secondary tern:text-secondary-foreground tern:hover:bg-secondary/80",
        ghost:
          "tern:hover:bg-accent tern:hover:text-accent-foreground tern:dark:hover:bg-accent/50",
        link: "tern:text-primary tern:underline-offset-4 tern:hover:underline",
      },
      size: {
        default: "tern:h-9 tern:px-4 tern:py-2 tern:has-[>svg]:px-3",
        sm: "tern:h-8 tern:rounded-md tern:gap-1.5 tern:px-3 tern:has-[>svg]:px-2.5",
        lg: "tern:h-10 tern:rounded-md tern:px-6 tern:has-[>svg]:px-4",
        icon: "tern:size-9",
        "icon-sm": "tern:size-8",
        "icon-lg": "tern:size-10",
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
