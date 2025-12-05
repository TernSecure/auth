import { cn } from '../../../lib/utils';
import { 
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../elements';
import { Check } from '../../icons';
import { useRouter } from '../../router';


export function PasswordResetSuccess() {
  const { navigate } = useRouter();
  const onBackToSignIn = () => navigate('../');

  return (
    <div className="tern:relative tern:flex tern:items-center tern:justify-center">
      <Card className={cn('tern:w-full tern:max-w-md tern:mx-auto tern:mt-8')}>
        <CardHeader className="tern:space-y-1 tern:text-center">
          <div className="tern:w-12 tern:h-12 tern:mx-auto tern:bg-green-500 tern:rounded-full tern:flex tern:items-center tern:justify-center tern:text-white">
            <Check className="tern:w-6 tern:h-6" />
          </div>
          <CardTitle className="tern:font-bold">Check your email</CardTitle>
          <CardDescription className="tern:text-muted-foreground">
            Password reset instructions sent
          </CardDescription>
        </CardHeader>
        <CardContent className="tern:space-y-4">
          <Button
            onClick={onBackToSignIn}
            className="tern:w-full"
          >
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}