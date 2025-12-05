import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../lib/utils"

const alertVariants = cva(
  "tern:relative tern:w-full tern:rounded-lg tern:border tern:px-4 tern:py-3 tern:text-sm tern:grid tern:has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] tern:grid-cols-[0_1fr] tern:has-[>svg]:gap-x-3 tern:gap-y-0.5 tern:items-start tern:[&>svg]:size-4 tern:[&>svg]:translate-y-0.5 tern:[&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "tern:bg-card tern:text-card-foreground",
        destructive:
          "tern:text-destructive tern:bg-card tern:[&>svg]:text-current tern:*:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "tern:col-start-2 tern:line-clamp-1 tern:min-h-4 tern:font-medium tern:tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "tern:text-muted-foreground tern:col-start-2 tern:grid tern:justify-items-start tern:gap-1 tern:text-sm tern:[&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
