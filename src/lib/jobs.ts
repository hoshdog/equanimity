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
import type { Job, Project, Customer } from './types';


// Get all jobs for a specific project
export async function getJobsForProject(orgId: string, projectId: string): Promise<Job[]> {
  const jobsCollection = collection(db, 'orgs', orgId, 'jobs', projectId, 'tasks');
  const q = query(jobsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}


// Add a new job to a project
export async function addJob(orgId: string, projectId: string, jobData: Omit<Job, 'id' | 'createdAt'>): Promise<string> {
    const jobsCollection = collection(db, 'orgs', orgId, 'jobs', projectId, 'tasks');
    const newJobRef = await addDoc(jobsCollection, {
        ...jobData,
        createdAt: serverTimestamp(),
    });
    return newJobRef.id;
}
