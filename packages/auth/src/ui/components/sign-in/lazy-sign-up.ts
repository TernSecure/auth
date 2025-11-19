import { lazy } from 'react';

const preloadSignUp = () => import(/* webpackChunkName: "signUp" */ '../sign-up');

const LazySignUpStart = lazy(() => preloadSignUp().then(m => ({ default: m.SignUpStart })));


export {
  preloadSignUp,
  LazySignUpStart,
};
