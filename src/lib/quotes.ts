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
  Timestamp,
} from 'firebase/firestore';
import type { Quote } from './types';


// Get all quotes from all projects for the main list view
export async function getQuotes(): Promise<Quote[]> {
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

// Add a new quote
export async function addQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const quotesCollectionRef = collection(db, 'quotes');
  
  const dataToSave = {
    ...quoteData,
    quoteDate: Timestamp.fromDate(quoteData.quoteDate as Date),
    expiryDate: Timestamp.fromDate(quoteData.expiryDate as Date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const newQuoteRef = await addDoc(quotesCollectionRef, dataToSave);
  return newQuoteRef.id;
}
