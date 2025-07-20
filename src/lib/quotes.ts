// src/lib/quotes.ts
import { db } from './firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  collectionGroup,
  where,
} from 'firebase/firestore';
import type { Quote } from './types';


// Get all quotes from all projects for the main list view
export async function getQuotes(): Promise<Quote[]> {
    // This query is now on a root-level 'quotes' collection
    const quotesRef = collection(db, 'quotes');
    const q = query(quotesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Quote));
}


// Get all quotes for a specific project
export async function getQuotesForProject(projectId: string): Promise<Quote[]> {
  const quotesRef = collection(db, 'quotes');
  const q = query(quotesRef, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  } as Quote));
}

// Add a new quote to a specific project
export async function addQuote(quoteData: Omit<Quote, 'id' | 'createdAt'>): Promise<string> {
  const quotesCollectionRef = collection(db, 'quotes');
  const newQuoteRef = await addDoc(quotesCollectionRef, {
      ...quoteData,
      createdAt: serverTimestamp(),
  });
  // Here you would also update subcollections if needed, for example in customer or project docs.
  return newQuoteRef.id;
}
