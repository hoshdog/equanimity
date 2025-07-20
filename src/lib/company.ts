// src/lib/company.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Company } from './types';

const companiesCollection = collection(db, 'companies');

// Get a single company document by ID
export async function getCompany(id: string): Promise<Company | null> {
  const docRef = doc(db, 'companies', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Company;
  }
  return null;
}

// Add a new company
export async function addCompany(companyData: Omit<Company, 'id' | 'createdAt'>): Promise<string> {
    const newCompanyRef = await addDoc(companiesCollection, {
        ...companyData,
        createdAt: serverTimestamp(),
    });
    return newCompanyRef.id;
}

// Update a company
export async function updateCompany(id: string, data: Partial<Company>) {
  const docRef = doc(db, 'companies', id);
  await updateDoc(docRef, data);
}
