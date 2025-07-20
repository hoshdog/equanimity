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

export const auth = getAuth(app);

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return onFirebaseAuthStateChanged(auth, callback);
}

export async function signUp(email: string, password: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function sendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
