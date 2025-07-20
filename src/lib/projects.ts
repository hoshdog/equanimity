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
import type { Project, ProjectSummary } from './types';

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
export async function addProject(projectData: Omit<Project, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const batch = writeBatch(db);

    // 1. Create the main project document
    const newProjectRef = doc(projectsCollection);
    batch.set(newProjectRef, {
        ...projectData,
        status: 'Planning',
        createdAt: serverTimestamp(),
    });

    // 2. Add a summary to the customer's subcollection
    const customerProjectSummaryRef = doc(collection(db, 'customers', projectData.customerId, 'projects'));
    const projectSummary: ProjectSummary = {
        id: newProjectRef.id,
        name: projectData.name,
        status: 'Planning',
        value: 0, // Initial value
    };
    batch.set(customerProjectSummaryRef, projectSummary);

    await batch.commit();
    return newProjectRef.id;
}


// Update a project
export async function updateProject(id: string, data: Partial<Project>) {
  const docRef = doc(db, 'projects', id);
  await updateDoc(docRef, data);
}

// Delete a project
export async function deleteProject(id: string) {
  const docRef = doc(db, 'projects', id);
  await deleteDoc(docRef);
  // Also delete from customer subcollection if needed
}
