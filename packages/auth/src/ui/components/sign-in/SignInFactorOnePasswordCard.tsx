import { cn } from '../../../lib/utils';
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldGroup,
  useAppForm,
  useCardState,
} from '../../elements';
import { FormButton } from '../../utils/form';

type SignInFactorOnePasswordProps = {
  signInWithPassword: (password: string) => Promise<void>;
  onForgotPassword?: () => void;
};

const defaultValues = {
  password: '',
};

export const SignInFactorOnePasswordCard = (props: SignInFactorOnePasswordProps) => {
  const card = useCardState();
  const { signInWithPassword, onForgotPassword } = props;
  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmitAsync: ({ value }) => {
        return signInWithPassword?.(value.password);
      },
    },
  });

  return (
    <div className='relative flex justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card className={cn('mt-8 w-full max-w-md')}>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className={cn('font-bold')}>Enter your password</CardTitle>
            <CardDescription className={cn('text-muted-foreground')}>
              Enter the password for your account to continue
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
            <form
              onSubmit={e => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <FieldGroup>
                <form.AppField name='password'>
                  {field => (
                    <field.TernPasswordField
                      label='Password'
                      placeholder='Enter your password'
                      disabled={form.state.isSubmitting || card.isLoading}
                      required
                      onForgotPassword={onForgotPassword}
                    />
                  )}
                </form.AppField>
                <FormButton
                  canSubmit={form.state.canSubmit}
                  isSubmitting={form.state.isSubmitting}
                  submitText='Continue'
                  submittingText='Signing in...'
                />
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
