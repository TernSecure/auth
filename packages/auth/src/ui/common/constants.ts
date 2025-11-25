import type { Attribute } from '@tern-secure/types';

export type SignInStartIdentifier = 'email_address' | 'phone_number';
export const groupIdentifiers = (attributes: Attribute[]): SignInStartIdentifier[] => {
    // Always skip passkey, while passkey can be considered an identifier we want to exclude it in the UI we are delivering
    let newAttributes: string[] = [...attributes.filter(a => a !== 'passkey')];

    //merge email_address and username attributes
    if (['email_address', 'username'].every(r => newAttributes.includes(r))) {
        newAttributes = newAttributes.filter(a => !['email_address', 'username'].includes(a));
        newAttributes.unshift('email_address_username');
    }

    return newAttributes as SignInStartIdentifier[];
};
export const getIdentifiers = (identifier: SignInStartIdentifier) => {
    if (identifier === 'phone_number') {
        return {
            fieldName: 'phoneNumber',
            label: 'Phone number',
            placeholder: 'Enter your phone number',
        };
    }

    return {
        fieldName: 'email',
        label: 'Email',
        placeholder: 'Enter your email',
    };
};