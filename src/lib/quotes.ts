// src/lib/quotes.ts
import { db } from './firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  doc
} from 'firebase/firestore';
import type { Quote } from './types';

// Get all quotes for a specific project
export async function getQuotesForProject(projectId: string): Promise<Quote[]> {
  const quotesRef = collection(db, 'projects', projectId, 'quotes');
  const q = query(quotesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  } as Quote));
}

// Add a new quote to a specific project
export async function addQuote(projectId: string, quoteData: Omit<Quote, 'id' | 'createdAt'>): Promise<string> {
  const quotesCollectionRef = collection(db, 'projects', projectId, 'quotes');
  const newQuoteRef = await addDoc(quotesCollectionRef, {
      ...quoteData,
      createdAt: serverTimestamp(),
  });
  return newQuoteRef.id;
}
