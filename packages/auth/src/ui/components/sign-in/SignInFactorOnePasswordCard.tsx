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
    <div className='tern:relative tern:flex tern:justify-center tern:p-6 tern:md:p-10'>
      <div className='tern:w-full tern:max-w-sm'>
        <Card className={cn('tern:mt-8 tern:w-full tern:max-w-md')}>
          <CardHeader className='tern:space-y-1 tern:text-center'>
            <CardTitle className={cn('tern:font-bold')}>Enter your password</CardTitle>
            <CardDescription className={cn('tern:text-muted-foreground')}>
              Enter the password for your account to continue
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
            <FieldGroup>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  void form.handleSubmit();
                }}
                className='tern:flex tern:flex-col tern:gap-4'
              >
                <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <>
                      <form.AppField name='password'>
                        {field => (
                          <field.TernPasswordField
                            label='Password'
                            placeholder='Enter your password'
                            disabled={isSubmitting || card.isLoading}
                            required
                            onForgotPassword={onForgotPassword}
                          />
                        )}
                      </form.AppField>
                      <FormButton
                        canSubmit={canSubmit}
                        isSubmitting={isSubmitting}
                        submitText='Continue'
                        submittingText='Signing in...'
                      />
                    </>
                  )}
                </form.Subscribe>
              </form>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
