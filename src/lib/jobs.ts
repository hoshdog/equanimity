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
  serverTimestamp,
} from 'firebase/firestore';
import type { Job, Project } from './types';

const jobsCollection = collection(db, 'jobs');

// Get all jobs, optionally filtered by projectId
export async function getJobs(projectId?: string): Promise<Job[]> {
  const constraints = [orderBy('createdAt', 'desc')];
  if (projectId) {
      constraints.push(where('projectId', '==', projectId));
  }
  const q = query(jobsCollection, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
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
        // Convert dates to Timestamps if they are Date objects
        startDate: jobData.startDate ? jobData.startDate : null,
        endDate: jobData.endDate ? jobData.endDate : null,
        projectId: projectId,
        projectName: projectData.name,
        customerId: projectData.customerId,
        customerName: projectData.customerName,
        createdAt: serverTimestamp(),
    });
    return newJobRef.id;
}
