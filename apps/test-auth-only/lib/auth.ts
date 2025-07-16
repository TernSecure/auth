import { TernSecureAuth } from "@tern-secure/auth";
import { useEffect, useState } from "react";

const tern = TernSecureAuth.initialize({
    ternSecureConfig: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID || '',
        appName: process.env.NEXT_PUBLIC_FIREBASE_APP_NAME || ''
    },
    requiresVerification: true
})

export const signIn = tern.signIn;

export const signUp = tern.signUp;

export const useSignIn = () => {
    const {  signIn } = tern;
}



export const useAuth = () => {
    
    useEffect(() => {
        const unsubscribe = tern.onAuthStateChanged((user) => {
            console.log('[useAuth] - Auth state changed:', user);
        });
        return () => unsubscribe();
    }, []);
    
    const t = tern.internalAuthState
    return  {
        user: t.user,
        isAuthenticated: t.isAuthenticated,
        isLoading: tern.isLoading,
        isReady: tern.isReady,
        error: t.error,
        status: tern.status
    }
}