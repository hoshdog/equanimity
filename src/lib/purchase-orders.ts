// src/lib/purchase-orders.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import type { PurchaseOrder, Project } from './types';

const poCollection = collection(db, 'purchaseOrders');

// Get all POs
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const q = query(poCollection); // Removed ordering to avoid index requirement for now
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
}

// Get all POs for a specific project
export async function getPurchaseOrdersForProject(projectId: string): Promise<PurchaseOrder[]> {
    const q = query(poCollection, where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as PurchaseOrder));
}


// Add a new PO to a specific project
export async function addPurchaseOrder(projectId: string, poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'projectName' | 'customerId'>): Promise<string> {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error("Project not found to create a purchase order under.");
    }
    const projectData = projectSnap.data() as Project;

    const newPORef = await addDoc(poCollection, {
        ...poData,
        projectName: projectData.name,
        customerId: projectData.customerId,
        createdAt: serverTimestamp(),
    });
    return newPORef.id;
}
