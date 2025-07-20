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
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Quote } from './types';


// Get all quotes from all projects for the main list view
export async function getQuotes(): Promise<Quote[]> {
    const quotesRef = collection(db, 'quotes');
    const q = query(quotesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Quote));
}

// Get a single quote
export async function getQuote(id: string): Promise<Quote | null> {
    const docRef = doc(db, 'quotes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Quote;
    }
    return null;
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
    dueDate: Timestamp.fromDate(quoteData.dueDate as Date),
    expiryDate: Timestamp.fromDate(quoteData.expiryDate as Date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const newQuoteRef = await addDoc(quotesCollectionRef, dataToSave);
  return newQuoteRef.id;
}


// Update an existing quote
export async function updateQuote(id: string, quoteData: Partial<Omit<Quote, 'id' | 'createdAt'>>) {
  const quoteRef = doc(db, 'quotes', id);
  const dataToUpdate = { ...quoteData };

  // Convert Date objects back to Timestamps if they exist
  if (dataToUpdate.quoteDate && dataToUpdate.quoteDate instanceof Date) {
      dataToUpdate.quoteDate = Timestamp.fromDate(dataToUpdate.quoteDate);
  }
  if (dataToUpdate.dueDate && dataToUpdate.dueDate instanceof Date) {
      dataToUpdate.dueDate = Timestamp.fromDate(dataToUpdate.dueDate);
  }
  if (dataToUpdate.expiryDate && dataToUpdate.expiryDate instanceof Date) {
      dataToUpdate.expiryDate = Timestamp.fromDate(dataToUpdate.expiryDate);
  }

  await updateDoc(quoteRef, {
    ...dataToUpdate,
    updatedAt: serverTimestamp(),
  });
}
