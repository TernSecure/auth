import * as LabelPrimitive from "@radix-ui/react-label"
import * as React from "react"

import { cn } from "../../lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "tern:flex tern:items-center tern:gap-2 tern:text-sm tern:leading-none tern:font-medium tern:select-none tern:group-data-[disabled=true]:pointer-events-none tern:group-data-[disabled=true]:opacity-50 tern:peer-disabled:cursor-not-allowed tern:peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
