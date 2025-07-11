// src/lib/purchase-orders.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  where,
  collectionGroup,
} from 'firebase/firestore';
import type { PurchaseOrder } from './types';

// Get all POs from all projects for the main list view
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const posRef = collectionGroup(db, 'purchaseOrders');
    const q = query(posRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const pos: PurchaseOrder[] = [];
    snapshot.forEach(doc => {
        const path = doc.ref.path;
        const pathSegments = path.split('/');
        // The structure is projects/{projectId}/purchaseOrders/{poId}
        const projectId = pathSegments[pathSegments.length - 3];
        pos.push({ id: doc.id, projectId, ...doc.data() } as PurchaseOrder);
    });

    return pos;
}

// Get all POs for a specific project
export async function getPurchaseOrdersForProject(projectId: string): Promise<PurchaseOrder[]> {
    const poRef = collection(db, 'projects', projectId, 'purchaseOrders');
    const q = query(poRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        projectId,
        ...doc.data()
    } as PurchaseOrder));
}


// Add a new PO to a specific project
export async function addPurchaseOrder(projectId: string, poData: Omit<PurchaseOrder, 'id' | 'createdAt'>): Promise<string> {
    const poCollectionRef = collection(db, 'projects', projectId, 'purchaseOrders');
    const newPORef = await addDoc(poCollectionRef, {
        ...poData,
        createdAt: serverTimestamp(),
    });
    return newPORef.id;
}
