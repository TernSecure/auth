import type { 
    InitialState,
    TernSecureResources,
    TernSecureUser,
} from "@tern-secure/types";


export const deriveAuthState = (authState: TernSecureResources, initialState: InitialState | undefined ) => {
  if (initialState) {
    return fromInitialState(initialState);
  }
  return fromClientSideState(authState);
};

const fromInitialState = (initialState: InitialState) => {
  const userId = initialState.userId;
  const token = initialState.token;
  const email = initialState.email;
  const user = initialState.user as TernSecureUser;
  
  return {
    userId,
    token,
    email,
    user
  }
}


const fromClientSideState = (authState: TernSecureResources) => {
  const userId: string | null | undefined = authState.user ? authState.user.uid : authState.user;
  //const token = authState.user ? authState.user.getIdToken() : null;
  const email = authState.user ? authState.user.email : null;
  const user = authState.user;

  return {
    userId,
    //token,
    email,
    user
  };
};