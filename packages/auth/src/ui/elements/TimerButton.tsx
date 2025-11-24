import { useSafeLayoutEffect } from '@tern-secure/shared/react';
import React, { useEffect } from 'react';

import { Button } from './button';

type TimerButtonProps = React.ComponentProps<typeof Button> & {
  throttleTimeInSec?: number;
  startDisabled?: boolean;
  showCounter?: boolean;
};

export const TimerButton = ({
  onClick: onClickProp,
  children,
  startDisabled,
  throttleTimeInSec = 30,
  showCounter = true,
  ...props
}: TimerButtonProps) => {
  const [remainingSeconds, setRemainingSeconds] = React.useState(0);
  const intervalIdRef = React.useRef<number | undefined>(undefined);
  useSafeLayoutEffect(() => {
    if (startDisabled) {
      disable();
    }
  }, []);

  useEffect(() => {
    return () => clearInterval(intervalIdRef.current);
  }, []);

  const disable = () => {
    setRemainingSeconds(throttleTimeInSec);
    intervalIdRef.current = window.setInterval(() => {
      setRemainingSeconds(seconds => {
        if (seconds === 1) {
          clearInterval(intervalIdRef.current);
        }
        return seconds - 1;
      });
    }, 1000);
  };

  const handleOnClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    if (remainingSeconds) {
      return;
    }
    onClickProp?.(e);
    disable();
  };

  return (
    <Button
      {...props}
      variant={props.variant || 'link'}
      disabled={remainingSeconds > 0 || props.disabled}
      onClick={handleOnClick}
    >
      {children}
      {remainingSeconds > 0 && showCounter ? ` (${remainingSeconds})` : ''}
    </Button>
  );
};
