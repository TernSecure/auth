import '../../../index.css'

import { useTernSecure } from '@tern-secure/shared/react'

import { useAuthUser } from '../../ctx'
import { 
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
} from '../../elements';

export function UserButton() {
    const user = useAuthUser();
    const ternSecure = useTernSecure();

    const handleSignOut = () => {
        ternSecure.signOut();
    }

    const handleSignIn = () => {
        ternSecure.redirectToSignIn();
    }
    
    let avatarFallbackContent: string;
    let avatarAltText = 'User Avatar';

    if (!user) {
        avatarFallbackContent = '?'; 
        avatarAltText = 'Guest Avatar';
    } else {
        avatarFallbackContent = user.displayName?.charAt(0).toUpperCase() || 'U';
        if (user.displayName) {
            avatarAltText = `${user.displayName}'s Avatar`;
        }
    }
    
    return (
        <div className="tern" style={{ display: 'contents' }}>
        {user ? (
            <Button 
               onClick={handleSignOut} 
               variant="outline" 
               className="tern:flex tern:items-center tern:gap-2"
            >
                <Avatar>
                    <AvatarImage src={user?.photoURL || undefined} alt={avatarAltText}/>
                    <AvatarFallback>{avatarFallbackContent}</AvatarFallback>
                </Avatar>
                Sign Out
            </Button>
        ) : (
            <Button 
               onClick={handleSignIn} 
               variant="outline" 
               className="tern:flex tern:items-center tern:gap-2"
            >
                <Avatar>
                    <AvatarImage src={undefined} alt={avatarAltText}/>
                    <AvatarFallback>{avatarFallbackContent}</AvatarFallback>
                </Avatar>
                Sign In
            </Button>
        )}
        </div>
    );
}