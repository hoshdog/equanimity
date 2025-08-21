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
  onSnapshot
} from 'firebase/firestore';
import type { Project, Customer } from './types';
import { auth } from './auth';

// Get all projects for a given organization
export async function getProjects(orgId: string): Promise<Project[]> {
  // Use mock data service during migration
  const { mockDataService } = await import('@/lib/mock-data');
  return await mockDataService.getProjects();
}

// Subscribe to real-time updates for an organization's projects
export function subscribeToProjects(orgId: string, callback: (projects: Project[]) => void) {
    const projectsCollection = collection(db, 'orgs', orgId, 'projects');
    const q = query(projectsCollection, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        callback(projects);
    });
}

// Get a single project
export async function getProject(orgId: string, projectId: string): Promise<Project | null> {
  const docRef = doc(db, 'orgs', orgId, 'projects', projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  }
  return null;
}

// Add a new project
export async function addProject(orgId: string, projectData: Omit<Project, 'id' | 'createdAt' | 'status' | 'customerName' | 'code' | 'updatedAt' | 'createdBy'>): Promise<string> {
  // Use mock data service during migration
  const { mockDataService } = await import('@/lib/mock-data');
  return await mockDataService.addProject(projectData);
}


// Update a project
export async function updateProject(orgId: string, projectId: string, data: Partial<Project>) {
  const authInstance = auth();
  const user = authInstance.currentUser;
  if (!user) throw new Error("User must be authenticated to update a project.");
  
  const docRef = doc(db, 'orgs', orgId, 'projects', projectId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete a project
export async function deleteProject(orgId: string, projectId: string) {
  const docRef = doc(db, 'orgs', orgId, 'projects', projectId);
  await deleteDoc(docRef);
}

// Get projects by customer
export async function getProjectsByCustomer(orgId: string, customerId: string): Promise<Project[]> {
  const projectsRef = collection(db, 'orgs', orgId, 'projects');
  const q = query(projectsRef, where('customerId', '==', customerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

// Export getProjectById as an alias for getProject for compatibility
export const getProjectById = getProject;
