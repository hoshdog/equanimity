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
import type { StockItem } from './types';

const stockItemsCollection = collection(db, 'stockItems');

// Subscribe to real-time updates for stock items
export function subscribeToStockItems(
    callback: (items: StockItem[]) => void,
    onError: (error: FirestoreError) => void
) {
    const q = query(stockItemsCollection, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockItem));
        callback(items);
    }, onError);
    return unsubscribe;
}

// Add a new stock item
export async function addStockItem(itemData: Omit<StockItem, 'id' | 'createdAt'>): Promise<string> {
    const newItemRef = await addDoc(stockItemsCollection, {
        ...itemData,
        createdAt: serverTimestamp(),
    });
    return newItemRef.id;
}

// Update a stock item
export async function updateStockItem(id: string, data: Partial<Omit<StockItem, 'id'>>) {
  const docRef = doc(db, 'stockItems', id);
  await updateDoc(docRef, data);
}

// Delete a stock item
export async function deleteStockItem(id: string) {
  const docRef = doc(db, 'stockItems', id);
  await deleteDoc(docRef);
}
