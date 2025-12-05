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
    <div className='tern:relative tern:flex tern:justify-center tern:p-6 tern:md:p-10'>
      <div className='tern:w-full tern:max-w-sm'>
        <Card className={cn('tern:mt-8 tern:w-full tern:max-w-md')}>
          <CardHeader className='tern:space-y-1 tern:text-center'>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription className={cn('tern:text-muted-foreground')}>
              {props.emailSent
                ? "We've sent a verification link to your email address. Please check your inbox and click the link to continue."
                : 'Sending verification email...'}
            </CardDescription>
          </CardHeader>
          <CardContent className='tern:space-y-4'>
            {card.error && (
              <Alert
                variant='destructive'
                className='tern:animate-in tern:fade-in-50'
              >
                <AlertDescription>{card.error.message}</AlertDescription>
              </Alert>
            )}
            {props.emailSent && props.onResend && (
              <div className='tern:space-y-2'>
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
                  className='tern:w-full'
                  startDisabled
                  throttleTimeInSec={60}
                >
                  {props.isLoading ? 'Sending...' : 'Resend verification email'}
                </TimerButton>
              </div>
            )}
          </CardContent>
          <FieldDescription className='tern:text-center'>
            <a onClick={() => void goBack()}>Go back</a>
          </FieldDescription>
        </Card>
      </div>
    </div>
  );
};
