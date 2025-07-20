// src/lib/jobs.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  getDoc,
} from 'firebase/firestore';
import type { Job, Project } from './types';

const jobsCollection = collection(db, 'jobs');

// Get all jobs
export async function getJobs(): Promise<Job[]> {
  const q = query(jobsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}

// Get all jobs for a specific project
export async function getJobsForProject(projectId: string): Promise<Job[]> {
    const q = query(jobsCollection, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Job));
}


// Add a new job to a specific project
export async function addJob(projectId: string, jobData: Omit<Job, 'id' | 'createdAt' | 'projectId' | 'projectName' | 'customerId' | 'customerName'>): Promise<string> {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error("Project not found to create a job under.");
    }
    const projectData = projectSnap.data() as Project;

    const newJobRef = await addDoc(jobsCollection, {
        ...jobData,
        projectId: projectId,
        projectName: projectData.name,
        customerId: projectData.customerId,
        customerName: projectData.customerName,
        createdAt: new Date(), // Use client-side timestamp for immediate consistency
    });
    return newJobRef.id;
}
