// src/lib/auth.ts
'use client';

// Check if we should use mock authentication
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('INVALID') || 
                       process.env.ENABLE_FIREBASE_AUTH === 'false' ||
                       process.env.MIGRATION_MODE === 'true';

// Import appropriate auth implementation
let authImplementation: any;
let User: any;

if (USE_MOCK_AUTH) {
  // Use mock auth for development
  console.log('[Auth] Using mock authentication for development');
  const mockAuthModule = require('./auth-mock');
  authImplementation = mockAuthModule;
  User = mockAuthModule.MockUser;
} else {
  // Use Firebase auth
  const firebase = require('firebase/auth');
  const { app } = require('./firebase');
  
  let authInstance: any;
  
  function getAuthInstance() {
    if (!authInstance) {
      authInstance = firebase.getAuth(app);
    }
    return authInstance;
  }
  
  authImplementation = {
    auth: getAuthInstance,
    onAuthStateChanged: (callback: (user: any) => void) => {
      return firebase.onAuthStateChanged(getAuthInstance(), callback);
    },
    signInWithEmailAndPassword: async (email: string, password: string) => {
      return firebase.signInWithEmailAndPassword(getAuthInstance(), email, password);
    },
    createUserWithEmailAndPassword: async (email: string, password: string) => {
      return firebase.createUserWithEmailAndPassword(getAuthInstance(), email, password);
    },
    signOut: async () => {
      return firebase.signOut(getAuthInstance());
    },
    sendEmailVerification: firebase.sendEmailVerification,
  };
  
  User = firebase.User;
}

// Export unified API
export const auth = authImplementation.auth || authImplementation.getAuth;
export type { User };

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return authImplementation.onAuthStateChanged(callback);
}

export async function signUp(email: string, password: string): Promise<User> {
  const userCredential = await authImplementation.createUserWithEmailAndPassword(email, password);
  return userCredential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await authImplementation.signInWithEmailAndPassword(email, password);
  return userCredential.user;
}

export async function sendVerificationEmail(user: User): Promise<void> {
  if (authImplementation.sendEmailVerification) {
    await authImplementation.sendEmailVerification(user);
  } else {
    console.log('[Mock] Email verification would be sent to:', user.email);
  }
}

export async function signOut(): Promise<void> {
  await authImplementation.signOut();
}

// Export for compatibility
export const createUserWithEmailAndPassword = authImplementation.createUserWithEmailAndPassword;
export const signInWithEmailAndPassword = authImplementation.signInWithEmailAndPassword;
export const sendEmailVerification = authImplementation.sendEmailVerification || sendVerificationEmail;
