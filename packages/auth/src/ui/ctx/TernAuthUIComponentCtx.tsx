import type { ReactNode } from 'react';

import type { AvailableComponentName, AvailableComponentProps } from '../types';
import { SignInContext, SignUpContext, UserButtonContext } from './components';

export function TernAuthUIComponentProvider({
  componentName,
  props,
  children,
}: {
  componentName: AvailableComponentName;
  props: AvailableComponentProps;
  children: ReactNode;
}) {
  switch (componentName) {
    case 'SignIn':
      return <SignInContext.Provider value={{ componentName, ...props }}>{children}</SignInContext.Provider>
    case 'UserButton':
      return <UserButtonContext.Provider value={{ componentName, ...props }}>{children}</UserButtonContext.Provider>
      
    default:
      throw new Error(`unknown component context: ${componentName}`);
  }
}


export * from './components';