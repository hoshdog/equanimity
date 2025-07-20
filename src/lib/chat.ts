// src/lib/chat.ts
import { db } from './firebase';
import { auth } from './auth'; // Assuming you have a way to get current user
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  FirestoreError,
} from 'firebase/firestore';
import type { Message } from './types';

// Subscribe to messages for a specific project
export function subscribeToMessages(
  projectId: string,
  onNext: (messages: Message[]) => void,
  onError: (error: FirestoreError) => void
) {
  const messagesRef = collection(db, 'projects', projectId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
    onNext(messages);
  }, onError);

  return unsubscribe;
}

// Send a new message
export async function sendMessage(projectId: string, text: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to send a message.');
  }

  const messagesRef = collection(db, 'projects', projectId, 'messages');
  await addDoc(messagesRef, {
    text,
    senderId: user.uid,
    senderName: user.displayName || user.email?.split('@')[0] || 'Anonymous', // Use display name or fallback
    createdAt: serverTimestamp(),
  });
}
