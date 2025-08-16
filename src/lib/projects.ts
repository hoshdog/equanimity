// src/lib/projects.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import type { Project, Customer } from './types.legacy';
import { auth } from './auth';

// Get all projects for a given organization
export async function getProjects(): Promise<Project[]> {
  const projectsCollection = collection(db, 'projects');
  const q = query(projectsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

// Subscribe to real-time updates for an organization's projects
export function subscribeToProjects(callback: (projects: Project[]) => void) {
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        callback(projects);
    });
}

// Get a single project
export async function getProject(projectId: string): Promise<Project | null> {
  const docRef = doc(db, 'projects', projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  }
  return null;
}

// Add a new project
export async function addProject(projectData: Omit<Project, 'id' | 'createdAt' | 'status' | 'customerName' | 'code'>): Promise<string> {
    const authInstance = auth();
    const user = authInstance.currentUser;
    if (!user) throw new Error("User must be authenticated to create a project.");

    const customerDocRef = doc(db, 'customers', projectData.customerId);
    const customerSnap = await getDoc(customerDocRef);
    if (!customerSnap.exists()) {
        throw new Error("Customer not found for project creation.");
    }
    const customer = customerSnap.data() as Customer;
    
    // TODO: Implement server-side code generation for 'code' field.
    const newProjectData = {
        ...projectData,
        code: `PRJ-${Date.now().toString().slice(-4)}`,
        customerName: customer.name,
        status: 'Planning' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
    };

    const projectsCollection = collection(db, 'projects');
    const newProjectRef = await addDoc(projectsCollection, newProjectData);
    return newProjectRef.id;
}


// Update a project
export async function updateProject(projectId: string, data: Partial<Project>) {
  const authInstance = auth();
  const user = authInstance.currentUser;
  if (!user) throw new Error("User must be authenticated to update a project.");
  
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete a project
export async function deleteProject(projectId: string) {
  const docRef = doc(db, 'projects', projectId);
  await deleteDoc(docRef);
  // In a real app, you would also need to delete associated financialIntents, etc.
  // This is best handled with a Firebase Cloud Function.
}
