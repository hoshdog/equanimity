// src/lib/quotes.ts
import { db, storage } from './firebase';
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
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Quote, Attachment, Revision } from './types';
import { auth, onAuthStateChanged } from './auth';
import type { User } from 'firebase/auth';


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
        const data = docSnap.data();
        // Manually convert Timestamps to Dates for form compatibility
        return { 
            id: docSnap.id, 
            ...data,
            quoteDate: data.quoteDate?.toDate(),
            dueDate: data.dueDate?.toDate(),
            expiryDate: data.expiryDate?.toDate(),
        } as Quote;
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

// Helper function to reliably get the current user, waiting if necessary.
async function getCurrentUser(): Promise<User> {
    const authInstance = auth();
    const user = authInstance.currentUser;
    if (user) return user;

    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged((user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                reject(new Error("User is not authenticated."));
            }
        });
    });
}

// Add a new quote
export async function addQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'quoteNumber'>): Promise<string> {
  const user = await getCurrentUser();

  const quotesCollectionRef = collection(db, 'quotes');
  
  const dataToSave = {
    ...quoteData,
    lineItems: quoteData.lineItems?.map(item => ({ ...item, type: item.type || 'Part' })) || [], // Ensure type is set
    version: 1,
    revisions: [],
    attachments: [],
    // Audit fields
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  };

  const newQuoteRef = await addDoc(quotesCollectionRef, dataToSave);
  return newQuoteRef.id;
}

// Update an existing quote
export async function updateQuote(id: string, quoteData: Partial<Omit<Quote, 'id' | 'createdAt'>>, changeSummary: string) {
  const user = await getCurrentUser();

  const quoteRef = doc(db, 'quotes', id);
  const dataToUpdate = { ...quoteData };

  // Get current quote to determine version number
  const currentQuoteSnap = await getDoc(quoteRef);
  const currentVersion = currentQuoteSnap.data()?.version || 0;

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

  // Handle revision history
  const newRevision: Omit<Revision, 'changedAt'> = {
      version: currentVersion,
      changedBy: user.uid,
      changeSummary: changeSummary,
  };

  await updateDoc(quoteRef, {
    ...dataToUpdate,
    version: increment(1),
    revisions: arrayUnion({ ...newRevision, changedAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  });
}

// Upload a file and attach it to a quote
export async function uploadAndAttachFileToQuote(quoteId: string, file: File) {
    const user = await getCurrentUser();

    // 1. Upload file to Firebase Storage
    const storageRef = ref(storage, `quotes/${quoteId}/${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // 2. Create attachment metadata
    const newAttachment: Attachment = {
        name: file.name,
        url: downloadURL,
        uploadedAt: Timestamp.now(),
        uploadedBy: user.uid,
    };

    // 3. Update the quote document in Firestore
    const quoteRef = doc(db, 'quotes', quoteId);
    await updateDoc(quoteRef, {
        attachments: arrayUnion(newAttachment)
    });

    return newAttachment;
}
