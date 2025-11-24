import { Loader2 } from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from './card';
import { withCardStateProvider } from './ctx';

const LoadingContainer = ({ children }: { children: React.ReactNode }) => (
  <div className='flex flex-col items-center justify-center py-8'>{children}</div>
);

export const LoadingCard = withCardStateProvider(() => {
  return (
    <div className='relative flex justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle>Loading</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingContainer>
              <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
            </LoadingContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
