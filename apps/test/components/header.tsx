'use client';

import { useAuth } from '@tern-secure/nextjs';
import { clearNextSessionCookie } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Moon, Settings, User, Monitor, Sun } from 'lucide-react';
import { authHandlerOptions } from '@/lib/auth';
import { useTheme } from 'next-themes';

export function Header() {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const createSignOut = () => {
    signOut({
      async onBeforeSignOut() {
        await clearNextSessionCookie({
          cookies: authHandlerOptions.cookies,
          revokeRefreshTokensOnSignOut: authHandlerOptions.revokeRefreshTokensOnSignOut,
        });
      },
    });
  };

  return (
    <header className='border-b'>
      <div className='container mx-auto flex items-center justify-between px-4 py-4'>
        <div className='flex items-center gap-2'>
          <h1 className='text-xl font-semibold'>TernSecure Authentication Test</h1>
        </div>

        <nav className='flex items-center gap-4'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='rounded-full'
              >
                <User className='h-5 w-5' />
                <span className='sr-only'>User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-56'
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className='mr-2 h-4 w-4' />
                <span>Settings</span>
              </DropdownMenuItem>
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Theme
                </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setTheme('light')}
                className='cursor-pointer'
              >
                <Sun className='mr-2 h-4 w-4' />
                Light
                {theme === 'light' && <div className='ml-auto h-2 w-2 rounded-full bg-blue-600' />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('dark')}
                className='cursor-pointer'
              >
                <Moon className='mr-2 h-4 w-4' />
                Dark
                {theme === 'dark' && <div className='ml-auto h-2 w-2 rounded-full bg-blue-600' />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('system')}
                className='cursor-pointer'
              >
                <Monitor className='mr-2 h-4 w-4' />
                System
                {theme === 'system' && <div className='ml-auto h-2 w-2 rounded-full bg-blue-600' />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={createSignOut}
                className='text-destructive'
              >
                <LogOut className='mr-2 h-4 w-4' />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
