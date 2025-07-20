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
  where,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import type { Project, Customer } from './types';
import { getCustomer } from './customers';
import { auth } from './auth';

const projectsCollection = collection(db, 'projects');

// Get all projects once
export async function getProjects(): Promise<Project[]> {
  const q = query(projectsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

// Subscribe to real-time updates for projects
export function subscribeToProjects(callback: (projects: Project[]) => void) {
    const q = query(projectsCollection, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        callback(projects);
    });
}


// Get a single project
export async function getProject(id: string): Promise<Project | null> {
  const docRef = doc(db, 'projects', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  }
  return null;
}

// Add a new project
export async function addProject(projectData: Omit<Project, 'id' | 'createdAt' | 'status' | 'customerName' | 'projectCode'>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be authenticated to create a project.");

    const customer = await getCustomer(projectData.customerId);
    if (!customer) {
        throw new Error("Customer not found for project creation.");
    }
    
    const newProjectRef = await addDoc(projectsCollection, {
        ...projectData,
        customerName: customer.name, // Denormalized field
        status: 'Planning',
        // Audit Trail
        createdBy: user.uid,
        updatedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return newProjectRef.id;
}


// Update a project
export async function updateProject(id: string, data: Partial<Project>) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be authenticated to update a project.");
  
  const docRef = doc(db, 'projects', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  });
}

// Delete a project
export async function deleteProject(id: string) {
  const docRef = doc(db, 'projects', id);
  await deleteDoc(docRef);
  // In a real app, you would also need to delete associated jobs, quotes, etc.
  // This is best handled with a Firebase Cloud Function.
}
