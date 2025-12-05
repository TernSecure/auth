import type { SocialProvider } from '@tern-secure/types';

import { cn } from '../../lib/utils';
import { ProviderInitialIcon } from '../common/ProviderInitialIcon';
import { Button } from './button';

interface SocialButtonsProps {
  onProviderClick: (provider: SocialProvider) => void;
  disabled?: boolean;
  providers: SocialProvider[];
}

export const SocialButtons = ({ onProviderClick, disabled, providers }: SocialButtonsProps) => {
  return (
    <div className="tern:grid tern:gap-4 tern:sm:grid-cols-2">
      {providers.map((provider, index) => (
        <Button
          key={provider.name}
          variant="outline"
          className={cn(
            'tern:w-full tern:gap-2',
            providers.length % 2 !== 0 && index === providers.length - 1 && 'tern:sm:col-span-2',
          )}
          onClick={() => onProviderClick(provider)}
          disabled={disabled}
        >
          <ProviderInitialIcon id={provider.name} className="h-4 w-4" />
          {provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}
        </Button>
      ))}
    </div>
  );
};
