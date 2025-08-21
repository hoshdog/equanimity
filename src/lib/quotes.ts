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


// Get all quotes from all projects for a specific organization
export async function getQuotes(orgId: string): Promise<Quote[]> {
    const quotesRef = collection(db, 'orgs', orgId, 'quotes');
    const q = query(quotesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Quote));
}

// Get a single quote from an organization
export async function getQuote(orgId: string, id: string): Promise<Quote | null> {
    const docRef = doc(db, 'orgs', orgId, 'quotes', id);
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
export async function getQuotesForProject(orgId: string, projectId: string): Promise<Quote[]> {
  const quotesRef = collection(db, 'orgs', orgId, 'quotes');
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
    if (authInstance.currentUser) {
        return authInstance.currentUser;
    }

    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged((user) => {
            if (user) {
                unsubscribe();
                resolve(user);
            }
        });
    });
}

// Add a new quote
export async function addQuote(orgId: string, quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'quoteNumber'>): Promise<string> {
  const user = await getCurrentUser();

  const quotesCollectionRef = collection(db, 'orgs', orgId, 'quotes');
  
  const dataToSave = {
    ...quoteData,
    lineItems: quoteData.lineItems?.map(item => ({ ...item, type: item.type || 'Part' })) || [], // Ensure type is set
    version: 1,
    revisions: [],
    attachments: [],
    likelihood: 75,
    estNetProfit: 0,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  };

  const newQuoteRef = await addDoc(quotesCollectionRef, dataToSave);
  return newQuoteRef.id;
}

// Update an existing quote
export async function updateQuote(orgId: string, id: string, quoteData: Partial<Omit<Quote, 'id' | 'createdAt'>>, changeSummary: string) {
  const user = await getCurrentUser();

  const quoteRef = doc(db, 'orgs', orgId, 'quotes', id);
  const dataToUpdate = { ...quoteData };

  const currentQuoteSnap = await getDoc(quoteRef);
  if (!currentQuoteSnap.exists()) {
    throw new Error("Quote to update does not exist.");
  }
  const currentQuoteData = currentQuoteSnap.data() as Quote;
  const currentVersion = currentQuoteData.version || 0;

  if (dataToUpdate.quoteDate && dataToUpdate.quoteDate instanceof Date) {
      dataToUpdate.quoteDate = Timestamp.fromDate(dataToUpdate.quoteDate);
  }
  if (dataToUpdate.dueDate && dataToUpdate.dueDate instanceof Date) {
      dataToUpdate.dueDate = Timestamp.fromDate(dataToUpdate.dueDate);
  }
  if (dataToUpdate.expiryDate && dataToUpdate.expiryDate instanceof Date) {
      dataToUpdate.expiryDate = Timestamp.fromDate(dataToUpdate.expiryDate);
  }

  const newRevision: Omit<Revision, 'changedAt' | 'quoteData'> & { quoteData: Quote } = {
      version: currentVersion,
      changedBy: user.uid,
      changeSummary: changeSummary,
      quoteData: currentQuoteData,
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
export async function uploadAndAttachFileToQuote(orgId: string, quoteId: string, file: File) {
    const user = await getCurrentUser();

    const storageRef = ref(storage, `orgs/${orgId}/quotes/${quoteId}/${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    const newAttachment: Attachment = {
        name: file.name,
        url: downloadURL,
        uploadedAt: Timestamp.now(),
        uploadedBy: user.uid,
    };

    const quoteRef = doc(db, 'orgs', orgId, 'quotes', quoteId);
    await updateDoc(quoteRef, {
        attachments: arrayUnion(newAttachment)
    });

    return newAttachment;
}
