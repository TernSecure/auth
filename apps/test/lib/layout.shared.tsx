import Image from 'next/image';
import { TernSecureIcon } from '@/app/layout.client';
import Shield from '@/public/shield.png';

export const logo = (
  <>
    <Image
      alt='TernSecure'
      src={Shield}
      sizes='100px'
      className='w-22 hidden [.uwu_&]:block'
      aria-label='TernSecure'
    />
    <TernSecureIcon className='text-primary size-5 [.uwu_&]:hidden' />
  </>
);
