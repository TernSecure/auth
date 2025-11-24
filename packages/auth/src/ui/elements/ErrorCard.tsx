import { AlertCircle } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { useCardState, withCardStateProvider } from './ctx';

type ErrorCardProps = {
  cardTitle?: string;
  cardSubtitle?: string;
  message?: string;
  onBackLinkClick?: React.MouseEventHandler | undefined;
  shouldNavigateBack?: boolean;
};

export const ErrorCard = withCardStateProvider(({
  cardTitle = 'Unable to sign in',
  cardSubtitle = 'An error occurred during the sign in process',
  message,
  onBackLinkClick,
}: ErrorCardProps) => {
  const card = useCardState();
  const errorMessage = message || (card.error as any)?.message || 'An unexpected error occurred';

  return (
    <div className='relative flex justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className='font-bold text-destructive'>{cardTitle}</CardTitle>
            <CardDescription>{cardSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </CardContent>
          {onBackLinkClick && (
            <CardFooter>
              <Button variant='outline' className='w-full' onClick={onBackLinkClick}>
                Go back
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
});
