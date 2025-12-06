import { OTPInput, OTPInputContext } from "input-otp"
import { MinusIcon } from "lucide-react"
import * as React from "react"

import { cn } from "../../lib/utils"

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("tern:disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("tern:flex tern:items-center", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "tern:data-[active=true]:border-ring tern:data-[active=true]:ring-ring/50 tern:data-[active=true]:aria-invalid:ring-destructive/20 tern:dark:data-[active=true]:aria-invalid:ring-destructive/40 tern:aria-invalid:border-destructive tern:data-[active=true]:aria-invalid:border-destructive tern:dark:bg-input/30 tern:border-input tern:relative tern:flex tern:h-9 tern:w-9 tern:items-center tern:justify-center tern:border-y tern:border-r tern:text-sm tern:shadow-xs tern:transition-all tern:outline-none tern:first:rounded-l-md tern:first:border-l tern:last:rounded-r-md tern:data-[active=true]:z-10 tern:data-[active=true]:ring-[3px]",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="tern:pointer-events-none tern:absolute tern:inset-0 tern:flex tern:items-center tern:justify-center">
          <div className="tern:animate-caret-blink tern:bg-foreground tern:h-4 tern:w-px tern:duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
