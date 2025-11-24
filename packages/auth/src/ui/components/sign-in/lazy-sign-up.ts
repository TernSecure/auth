import { lazy } from 'react';

const preloadSignUp = () => import(/* webpackChunkName: "signUp" */ '../sign-up');

const LazySignUpVerifyEmail = lazy(() => preloadSignUp().then(m => ({ default: m.SignUpVerifyEmail })));
const LazySignUpStart = lazy(() => preloadSignUp().then(m => ({ default: m.SignUpStart })));


export {
  preloadSignUp,
  LazySignUpStart,
  LazySignUpVerifyEmail,
};
