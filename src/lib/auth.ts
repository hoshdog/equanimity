// src/lib/auth.ts
'use client';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { app } from './firebase';

let authInstance: ReturnType<typeof getAuth>;

function getAuthInstance() {
    if (!authInstance) {
        authInstance = getAuth(app);
    }
    return authInstance;
}

export { getAuthInstance as auth };


export function onAuthStateChanged(callback: (user: User | null) => void) {
  return onFirebaseAuthStateChanged(getAuthInstance(), callback);
}

export async function signUp(email: string, password: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(getAuthInstance(), email, password);
  return userCredential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(getAuthInstance(), email, password);
  return userCredential.user;
}

export async function sendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getAuthInstance());
}
