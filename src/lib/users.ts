// src/lib/users.ts
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from './types';

// Get a user profile document by UID
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // A user's profile is not org-specific in this model, but it could be
  // by changing the path to `orgs/${orgId}/users/${uid}`.
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
  }
  return null;
}

// Create or update a user profile document
export async function updateUserProfile(uid: string, data: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt'>>) {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, data, { merge: true });
}
