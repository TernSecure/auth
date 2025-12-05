import * as React from "react"

import { cn } from "../../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "tern:file:text-foreground tern:placeholder:text-muted-foreground tern:selection:bg-primary tern:selection:text-primary-foreground tern:dark:bg-input/30 tern:border-input tern:h-9 tern:w-full tern:min-w-0 tern:rounded-md tern:border tern:bg-transparent tern:px-3 tern:py-1 tern:text-base tern:shadow-xs tern:transition-[color,box-shadow] tern:outline-none tern:file:inline-flex tern:file:h-7 tern:file:border-0 tern:file:bg-transparent tern:file:text-sm tern:file:font-medium tern:disabled:pointer-events-none tern:disabled:cursor-not-allowed tern:disabled:opacity-50 tern:md:text-sm",
        "tern:focus-visible:border-ring tern:focus-visible:ring-ring/50 tern:focus-visible:ring-[3px]",
        "tern:aria-invalid:ring-destructive/20 tern:dark:aria-invalid:ring-destructive/40 tern:aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
