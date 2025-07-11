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
  collectionGroup
} from 'firebase/firestore';
import type { Quote } from './types';


// Get all quotes from all projects for the main list view
export async function getQuotes(): Promise<Quote[]> {
    const quotesRef = collectionGroup(db, 'quotes');
    // Removed orderBy('createdAt', 'desc') to avoid needing a composite index.
    // Sorting will be done client-side.
    const q = query(quotesRef);
    const snapshot = await getDocs(q);
    
    const quotes: Quote[] = [];
    snapshot.forEach(doc => {
        const path = doc.ref.path;
        const pathSegments = path.split('/');
        // The structure is projects/{projectId}/quotes/{quoteId}
        const projectId = pathSegments[pathSegments.length - 3];
        quotes.push({ id: doc.id, projectId, ...doc.data() } as Quote);
    });

    // Sort the results by date here instead of in the query
    quotes.sort((a, b) => {
        const dateA = a.createdAt?.seconds ?? 0;
        const dateB = b.createdAt?.seconds ?? 0;
        return dateB - dateA;
    });


    return quotes;
}


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
