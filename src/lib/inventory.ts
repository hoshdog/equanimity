// src/lib/inventory.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  FirestoreError
} from 'firebase/firestore';
import type { CatalogueItem as StockItem } from './types'; // Renaming to align with new model

// Subscribe to real-time updates for stock items
export function subscribeToStockItems(
    orgId: string,
    callback: (items: StockItem[]) => void,
    onError: (error: FirestoreError) => void
) {
    const itemsCollection = collection(db, 'orgs', orgId, 'items');
    const q = query(itemsCollection, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
        callback(items);
    }, onError);
    return unsubscribe;
}

// Add a new stock item
export async function addStockItem(orgId: string, itemData: Omit<StockItem, 'id' | 'createdAt'>): Promise<string> {
    const itemsCollection = collection(db, 'orgs', orgId, 'items');
    const newItemRef = await addDoc(itemsCollection, {
        ...itemData,
        createdAt: serverTimestamp(),
    });
    return newItemRef.id;
}

// Update a stock item
export async function updateStockItem(orgId: string, id: string, data: Partial<Omit<StockItem, 'id'>>) {
  const docRef = doc(db, 'orgs', orgId, 'items', id);
  await updateDoc(docRef, data);
}

// Delete a stock item
export async function deleteStockItem(orgId: string, id: string) {
  const docRef = doc(db, 'orgs', orgId, 'items', id);
  await deleteDoc(docRef);
}
