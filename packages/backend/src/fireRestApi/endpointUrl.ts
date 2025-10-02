

export const getRefreshTokenEndpoint = (apiKey: string) => {
  return `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
};

export const signInWithPassword = (apiKey: string) => {
  return `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
};

export const signUpEndpoint = (apiKey: string) => {
  return `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
};

export const getCustomTokenEndpoint = (apiKey: string) => {
  return `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
};

export const passwordResetEndpoint = (apiKey: string) => {
  return `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`;
};
