import { cn } from '../../lib/utils';
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldDescription,
  TimerButton,
  useCardState,
} from '../elements';
import { useRouter } from '../router';

type VerificationLinkCardProps = {
  emailSent?: boolean;
  onResend?: () => Promise<void>;
  isLoading?: boolean;
};

export const VerificationLinkCard = (props: VerificationLinkCardProps) => {
  const { navigate } = useRouter();
  const card = useCardState();

  const goBack = () => {
    return navigate('../');
  };

  return (
    <div className='relative flex justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card className={cn('mt-8 w-full max-w-md')}>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription className={cn('text-muted-foreground')}>
              {props.emailSent
                ? "We've sent a verification link to your email address. Please check your inbox and click the link to continue."
                : 'Sending verification email...'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {card.error && (
              <Alert
                variant='destructive'
                className='animate-in fade-in-50'
              >
                <AlertDescription>{card.error.message}</AlertDescription>
              </Alert>
            )}
            {props.emailSent && props.onResend && (
              <div className='space-y-2'>
                <Alert>
                  <AlertDescription>
                    Didn&apos;t receive the email? Check your spam folder or click the button below
                    to resend.
                  </AlertDescription>
                </Alert>
                <TimerButton
                  onClick={() => void props.onResend?.()}
                  disabled={props.isLoading}
                  variant='outline'
                  className='w-full'
                  startDisabled
                  throttleTimeInSec={60}
                >
                  {props.isLoading ? 'Sending...' : 'Resend verification email'}
                </TimerButton>
              </div>
            )}
          </CardContent>
          <FieldDescription className='text-center'>
            <a onClick={() => void goBack()}>Go back</a>
          </FieldDescription>
        </Card>
      </div>
    </div>
  );
};
