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

// Get all POs for an organization
export async function getPurchaseOrders(orgId: string): Promise<PurchaseOrder[]> {
    const poCollection = collection(db, 'orgs', orgId, 'purchaseOrders');
    const q = query(poCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
}

// Get all POs for a specific project
export async function getPurchaseOrdersForProject(orgId: string, projectId: string): Promise<PurchaseOrder[]> {
    const poCollection = collection(db, 'orgs', orgId, 'purchaseOrders');
    const q = query(poCollection, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as PurchaseOrder));
}


// Add a new PO to a specific project
export async function addPurchaseOrder(orgId: string, projectId: string, poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'projectName' | 'customerId'>): Promise<string> {
    const poCollection = collection(db, 'orgs', orgId, 'purchaseOrders');
    const projectRef = doc(db, 'orgs', orgId, 'projects', projectId);
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
