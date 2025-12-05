import React from 'react';

import { cn } from '../../lib/utils';
import { ProviderInitialIcon } from '../common/ProviderInitialIcon';
import { Button } from './button';

interface SocialButtonsProps {
  onProviderClick: (provider: string) => void;
  disabled?: boolean;
}

export const SocialButtons = ({ onProviderClick, disabled }: SocialButtonsProps) => {
  const providers = ['google', 'github', 'facebook', 'microsoft', 'twitter'];

  return (
    <div className="tern:grid tern:gap-4 tern:sm:grid-cols-2">
      {providers.map((provider, index) => (
        <Button
          key={provider}
          variant="outline"
          className={cn(
            'tern:w-full tern:gap-2',
            providers.length % 2 !== 0 && index === providers.length - 1 && 'tern:sm:col-span-2',
          )}
          onClick={() => onProviderClick(provider)}
          disabled={disabled}
        >
          <ProviderInitialIcon id={provider} className="h-4 w-4" />
          {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </Button>
      ))}
    </div>
  );
};
